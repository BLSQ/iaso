#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.9"
# dependencies = ["requests"]
# ///
"""
Emulate the mobile app's entity sync against a running Iaso server.

Reproduces the exact request pattern of GetOrgUnits.kt and FetchEntities.kt in iaso-mobile-app
(not a guess -- traced from the actual client code). The pyramid comes first, like in the app:
  - GET /api/mobile/orgunits/?app_id=...&limit=25000&page=N&shapes=true|false, starting at page 1,
    following `has_next` (`roots` only on page 1). `shapes` is true when the app has the
    SHOW_DETAIL_MAP_ON_MOBILE or MOBILE_ORG_UNIT_REGISTRY feature flag (read from /api/apps/<app_id>/),
    the server then caps the page at 1000 org units. Always by page number: no cursor on org units
    (measured: 6 pages of 25k without shapes, the count/offset it would save are negligible)
Then the entities:
  - GET /api/mobile/entities/?app_id=...&page=N[&limit_date=...], starting at page 1
  - pagination is driven ONLY by `has_next` in the response body -- the client never
    uses `count`/`pages` to decide how many requests to make, they're display-only
  - a *full* sync (fresh install, nothing synced yet) omits `limit_date` entirely;
    pass --since to emulate an incremental sync instead
  - `limit` (page size) is never set by the client -- it always uses the server's
    default, so this script doesn't set it either
  - right after entities, the app also fetches GET /api/mobile/entities/deleted/
    with the same has_next-driven loop and no limit_date -- reproduced here too
  - the client treats ANY non-2xx response (404 included) as fatal: it aborts the
    whole sync stage, no automatic retry. This script surfaces that loudly instead
    of silently working around it, so a 404 here means a real device would break.

By default the next pages pass the `next_cursor` of the previous page as `cursor`
(keyset pagination): only page 1 is counted, `count`/`pages` come back null afterwards and
the count of page 1 is kept for display. `page` is still sent: a server without cursor
support returns no `next_cursor`, so the script keeps paging (and counting) by page number.
--no-cursor pages by page number only, counting every page (the old app behaviour).

Usage:
    uv run setuper/emulate_mobile_sync.py --app-id myaccount
    uv run setuper/emulate_mobile_sync.py --app-id myaccount --username bob --password secret
    uv run setuper/emulate_mobile_sync.py --app-id myaccount --since 2026-08-24
    uv run setuper/emulate_mobile_sync.py --app-id myaccount --skip-deleted
    uv run setuper/emulate_mobile_sync.py --app-id myaccount --no-cursor
    uv run setuper/emulate_mobile_sync.py --app-id myaccount --skip-entities   # pyramid only

Credentials/server default to setuper/credentials.py (the same file setuper.py uses)
when present; override with --server/--username/--password.
"""

import argparse
import sys
import time

from pathlib import Path

import requests


def load_credentials():
    """Reuse setuper/credentials.py if present (same file setuper.py itself uses)."""
    sys.path.insert(0, str(Path(__file__).parent))
    try:
        import credentials  # type: ignore

        return credentials.SERVER, credentials.ADMIN_USER_NAME, credentials.ADMIN_PASSWORD
    except ImportError:
        return "http://localhost:8081", None, None


def authenticate(server, username, password):
    r = requests.post(f"{server}/api/token/", json={"username": username, "password": password})
    r.raise_for_status()
    token = r.json()["access"]
    return {"Authorization": f"Bearer {token}"}


# GetOrgUnits.kt DEFAULT_LIMIT: the app always asks for 25k org units per page.
ORG_UNITS_LIMIT = 25_000


def get_feature_flags(server, headers, app_id):
    """The app's feature flag codes, as the app reads them (RefreshFeatureFlags.kt)."""
    r = requests.get(f"{server}/api/apps/{app_id}/", headers=headers)
    r.raise_for_status()
    return {flag["code"] for flag in r.json().get("feature_flags", [])}


def sync_paginated(server, headers, path, params, label, max_pages=None, use_cursor=False, results_key="results"):
    """Follow `has_next` exactly like FetchEntities.kt's do-while loop: never uses
    count/pages to decide how many pages to request, only has_next.

    With use_cursor, the logic the app would follow: always send `page`, add `cursor` only
    when the previous page returned a `next_cursor`. A server without cursor support returns
    none, so the next page is fetched (and counted) by page number, the old way."""
    page = 1
    total = 0
    server_count = None
    cursor = None
    cursor_pages = 0
    t0 = time.perf_counter()
    while True:
        page_params = {**params, "page": page}
        if cursor:
            page_params["cursor"] = cursor
            cursor_pages += 1
        page_t0 = time.perf_counter()
        r = requests.get(f"{server}{path}", params=page_params, headers=headers)
        page_elapsed = time.perf_counter() - page_t0

        if r.status_code == 404:
            # The real client has no code path that treats this as "pagination done" --
            # it throws and aborts the whole sync stage. Surface it loudly here too.
            print(f"  [{label}] page {page}: 404 Not Found -- this would ABORT the sync on a real device")

        r.raise_for_status()
        data = r.json()
        results = data.get(results_key, [])
        if data.get("roots") is not None:
            print(f"  [{label}] roots: {data['roots']}")
        total += len(results)
        if data.get("count") is not None:
            server_count = data["count"]
        has_next = data.get("has_next", False)
        if use_cursor:
            cursor = data.get("next_cursor")

        print(
            f"  [{label}] page {page}: {len(results)} rows in {page_elapsed:.2f}s "
            f"(running total {total}/{server_count}, has_next={has_next}"
            f"{f', next_cursor={cursor}' if use_cursor else ''})"
        )
        if use_cursor and has_next and cursor is None and page == 1:
            print(f"  [{label}] no next_cursor (server without cursor support): paging by page number, the old way")

        if not has_next:
            break
        if max_pages is not None and page >= max_pages:
            print(f"  [{label}] stopping at --max-pages={max_pages} (has_next was still true -- not a real end)")
            break
        page += 1

    elapsed = time.perf_counter() - t0
    print(f"[{label}] done: {total} rows over {page} page(s) ({cursor_pages} by cursor) in {elapsed:.2f}s\n")
    return total, page, elapsed


def main():
    # Line-buffer stdout so progress shows up immediately when piped/redirected, not just at exit.
    sys.stdout.reconfigure(line_buffering=True)

    default_server, default_user, default_password = load_credentials()

    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--server", default=default_server, help=f"Iaso server URL (default: {default_server})")
    parser.add_argument(
        "--max-pages",
        type=int,
        default=None,
        help="Testing convenience only -- stop after N pages instead of following has_next to the end "
        "(the real app has no such cap and always syncs everything)",
    )
    parser.add_argument(
        "--app-id", required=True, help="Project app_id to sync (e.g. the account name created by setuper.py)"
    )
    parser.add_argument("--username", default=default_user, help="User to sync as (defaults to setuper/credentials.py)")
    parser.add_argument(
        "--password", default=default_password, help="Password for --username (defaults to setuper/credentials.py)"
    )
    parser.add_argument(
        "--since", default=None, help="limit_date (YYYY-MM-DD) for an incremental sync; omit for a full sync"
    )
    parser.add_argument("--skip-deleted", action="store_true", help="Skip the paired /entities/deleted/ fetch")
    parser.add_argument("--skip-pyramid", action="store_true", help="Skip the /orgunits/ (pyramid) fetch")
    parser.add_argument("--skip-entities", action="store_true", help="Skip the /entities/ (and deleted) fetch")
    parser.add_argument(
        "--shapes",
        action=argparse.BooleanOptionalAction,
        default=None,
        help="Request org unit shapes; defaults to what the app does, from the project's feature flags",
    )
    parser.add_argument(
        "--cursor",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Follow next_cursor (keyset pagination) after page 1, only page 1 is counted; "
        "--no-cursor pages by page number, counting every page",
    )
    args = parser.parse_args()

    if not args.username or not args.password:
        parser.error("--username/--password required (or set ADMIN_USER_NAME/ADMIN_PASSWORD in setuper/credentials.py)")

    print(f"Authenticating as {args.username} on {args.server}")
    headers = authenticate(args.server, args.username, args.password)

    timings = {}  # stage -> (rows, pages, seconds)

    if not args.skip_pyramid:
        shapes = args.shapes
        if shapes is None:
            shapes = bool(
                get_feature_flags(args.server, headers, args.app_id)
                & {"SHOW_DETAIL_MAP_ON_MOBILE", "MOBILE_ORG_UNIT_REGISTRY"}
            )
        print(f"\n=== Pyramid sync emulation: app_id={args.app_id} (limit={ORG_UNITS_LIMIT}, shapes={shapes}) ===")
        timings["org units"] = sync_paginated(
            args.server,
            headers,
            "/api/mobile/orgunits/",
            # Retrofit sends the Boolean as "true"/"false", the server only checks for "true".
            {"app_id": args.app_id, "limit": ORG_UNITS_LIMIT, "shapes": str(shapes).lower()},
            "org units",
            max_pages=args.max_pages,
            results_key="orgUnits",
        )

    if not args.skip_entities:
        sync_kind = f"limit_date={args.since}" if args.since else "limit_date omitted -- first/full sync"
        count_kind = "cursor when the server supports it" if args.cursor else "page numbers, count on every page"
        print(f"\n=== Entity sync emulation: app_id={args.app_id} ({sync_kind}, {count_kind}) ===")

        entity_params = {"app_id": args.app_id}
        if args.since:
            entity_params["limit_date"] = args.since

        timings["entities"] = sync_paginated(
            args.server,
            headers,
            "/api/mobile/entities/",
            entity_params,
            "entities",
            max_pages=args.max_pages,
            use_cursor=args.cursor,
        )

        if not args.skip_deleted:
            timings["deleted"] = sync_paginated(
                args.server,
                headers,
                "/api/mobile/entities/deleted/",
                {"app_id": args.app_id},
                "deleted",
                max_pages=args.max_pages,
                use_cursor=args.cursor,
            )

    print("=== Summary ===")
    for stage, (rows, pages, seconds) in timings.items():
        print(f"{stage + ':':10} {rows} rows / {pages} page(s) / {seconds:.2f}s")
    print(f"total wall time: {sum(seconds for _, _, seconds in timings.values()):.2f}s")


if __name__ == "__main__":
    main()
