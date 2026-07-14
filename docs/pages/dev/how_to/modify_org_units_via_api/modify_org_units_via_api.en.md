# Modify the org units of a data source via the API

This guide is for an external organisation that needs to create and update org units in an IASO
data source from its own systems, using Python. It covers the two write paths IASO offers —
**direct modification** and **change requests** — how to choose between them, and the constraints
and quirks you will run into.

Everything below is plain JSON over HTTPS. The examples use
[`requests`](https://requests.readthedocs.io/); nothing else is required.

## The two write paths

| | Direct modification | Change request |
|---|---|---|
| Endpoints | `POST /api/orgunits/create_org_unit/`, `PATCH /api/orgunits/<id>/` | `POST /api/orgunits/changes/` |
| Effect | Applied immediately to the pyramid | Recorded as a proposal, applied only once a reviewer approves it |
| Permission needed | `iaso_org_units` | None beyond being authenticated and able to see the org unit |
| Reviewed by a human | No | Yes — by a user holding `iaso_org_unit_change_request_review` |
| Audit trail | Modification log | Full before/after snapshot, per-field approval, rejection comment |
| Can create an org unit | Yes | Not on its own — see below |
| Bulk | Async bulk-update task available | None; one request per org unit |

Use **change requests** when the IASO team wants to keep editorial control over the pyramid: your
system proposes, they decide. Use **direct modification** when your organisation is the authority on
this data and is trusted to write to it.

!!! warning "A change request cannot create an org unit by itself"
    Every change request points at an org unit that **already exists** — the `org_unit_id` field is
    mandatory in practice. To get a change request of kind `org_unit_creation`, you first create the
    org unit directly with `validation_status: "NEW"`, then submit a change request against it. IASO
    detects that the target is still `NEW` and treats the request as a creation; approving it flips
    the org unit to `VALID`, rejecting it flips it to `REJECTED`.

    That first step is a direct write, so it needs the `iaso_org_units` permission. **A user with no
    permission at all can only propose changes to existing org units, never add new ones.**

## Prerequisites

Ask the IASO administrator of the account for:

- a dedicated **user account** (do not share a human's credentials — the audit trail records the author of every change);
- the **permissions** matching the path you intend to use (see the table above);
- the **id of the data source and of the source version** you are allowed to write into;
- the **ids of the org unit types** and, if relevant, of the **groups** you will reference.

Two constraints are enforced server-side and are worth knowing before you start:

- The data source must not be flagged **read-only**. Every write to a read-only source is rejected.
- A user profile can be restricted to certain **org unit types** (`editable_org_unit_types`) and to a
  **branch of the hierarchy**. If yours is, you can only touch what falls inside those limits, and you
  cannot create root org units.

## Authentication

IASO issues JSON Web Tokens. Post your credentials to `/api/token/`, then send the returned `access`
token as a bearer token on every subsequent call.

```python
import requests

SERVER = "https://iaso.example.org"

r = requests.post(
    f"{SERVER}/api/token/",
    json={"username": "my-service-account", "password": "..."},
    timeout=30,
)
r.raise_for_status()
tokens = r.json()  # {"access": "...", "refresh": "..."}

headers = {"Authorization": f"Bearer {tokens['access']}"}
```

Access tokens are long-lived on a default IASO deployment, but do not rely on that: handle a `401` by
refreshing.

```python
r = requests.post(f"{SERVER}/api/token/refresh/", json={"refresh": tokens["refresh"]}, timeout=30)
tokens = r.json()  # a fresh "access", and a rotated "refresh"
```

!!! note "Deployments behind single sign-on"
    Some IASO instances disable password logins entirely, and on those `/api/token/` does not exist.
    There, a user already authenticated in the browser can call `GET /api/apitoken/` to obtain a
    token. It cannot be scripted from a username and a password — ask the administrator how machine
    access is meant to work on your instance.

### A small client to build on

The rest of this guide uses this helper, which refreshes the token when it expires and raises a
readable error when IASO rejects a payload.

```python
import requests


class IasoError(Exception):
    pass


class IasoClient:
    def __init__(self, server, username, password):
        self.server = server.rstrip("/")
        self.session = requests.Session()
        self._username = username
        self._password = password
        self._login()

    def _login(self):
        r = self.session.post(
            f"{self.server}/api/token/",
            json={"username": self._username, "password": self._password},
            timeout=30,
        )
        r.raise_for_status()
        tokens = r.json()
        self._refresh_token = tokens["refresh"]
        self.session.headers["Authorization"] = f"Bearer {tokens['access']}"

    def _refresh(self):
        r = self.session.post(
            f"{self.server}/api/token/refresh/",
            json={"refresh": self._refresh_token},
            timeout=30,
        )
        if r.status_code != 200:  # the refresh token itself has expired
            self._login()
            return
        tokens = r.json()
        self._refresh_token = tokens.get("refresh", self._refresh_token)
        self.session.headers["Authorization"] = f"Bearer {tokens['access']}"

    def request(self, method, path, **kwargs):
        kwargs.setdefault("timeout", 60)
        url = f"{self.server}{path}"
        r = self.session.request(method, url, **kwargs)
        if r.status_code == 401:
            self._refresh()
            r = self.session.request(method, url, **kwargs)
        if r.status_code >= 400:
            raise IasoError(f"{method} {path} -> {r.status_code}: {r.text}")
        return r.json() if r.content else None

    def get(self, path, **kw):
        return self.request("GET", path, **kw)

    def post(self, path, **kw):
        return self.request("POST", path, **kw)

    def patch(self, path, **kw):
        return self.request("PATCH", path, **kw)
```

## Finding the ids you need

Every write references a source version, an org unit type, and possibly groups and a parent — all by
numeric id. Fetch them once at the start of your run.

Note that each IASO endpoint wraps its results under its own key. They are not consistent, so read
the examples carefully.

```python
iaso = IasoClient(SERVER, USERNAME, PASSWORD)

# Data sources you can see, with their versions and their default version.
sources = iaso.get("/api/datasources/")["sources"]
for source in sources:
    print(source["id"], source["name"], "read_only:", source["read_only"])
    print("  default version:", source["default_version"])
    print("  versions:", [(v["id"], v["number"]) for v in source["versions"]])

# Org unit types, with the id you will pass as org_unit_type_id.
types = iaso.get("/api/orgunittypes/")["orgUnitTypes"]
type_by_name = {t["name"]: t["id"] for t in types}

# Groups. A group belongs to one source version, and an org unit can only join
# a group that lives in its own version.
groups = iaso.get("/api/groups/")["groups"]
```

The **source version id** is the one that matters for writes, not the data source id. A data source
is a container; a source version is a dated snapshot of the pyramid inside it, and an org unit
belongs to exactly one version. If you omit `version_id` when creating, IASO uses the **default
version of your account** — which is usually what you want when you write into the account's main
pyramid, but be explicit if there is any doubt.

## Reading org units

```python
# Search the default pyramid for a health facility by name.
result = iaso.get("/api/orgunits/", params={
    "version": 5,                 # source version id
    "search": "Kalémie",
    "validation_status": "all",
    "limit": 50,
    "page": 1,
})
```

Three things trip people up here.

**The list is filtered to `VALID` by default.** If you do not pass `validation_status`, org units
that are still `NEW` or that were `REJECTED` are invisible — including the ones you just created.
Pass `validation_status=all`, or an explicit comma-separated list such as `NEW,VALID`.

**The response envelope changes depending on whether you paginate.** With a `limit`, you get
`{"count": …, "orgunits": [...], "has_next": …, "page": …, "pages": …}` — note the lowercase
`orgunits`. Without a `limit`, you get the whole result set under `{"orgUnits": [...]}` — camelCase.
Always pass `limit` and paginate; it is both safer and cheaper.

**`search` accepts prefixes for exact lookups**, which is how you resolve your own identifiers to
IASO ids without fuzzy matching:

- `search=ids:12,13,14` — by IASO id
- `search=refs:ABC-001,ABC-002` — by `source_ref`, the external reference you control
- `search=codes:XYZ` — by `code`

Fetching a single org unit is `GET /api/orgunits/<id>/`.

!!! tip "If your system speaks FHIR"
    IASO also exposes org units as read-only FHIR R4 `Location` resources. If you are integrating a
    system that already consumes FHIR, see [reading org units through the FHIR
    API](../read_org_units_via_fhir/read_org_units_via_fhir.md). It is a read path only — all writes
    go through the endpoints described below.

## Path A — modifying org units directly

Requires the `iaso_org_units` permission.

### Creating

```python
new_org_unit = iaso.post("/api/orgunits/create_org_unit/", json={
    "name": "Centre de Santé de Kalémie",
    "org_unit_type_id": type_by_name["Health facility"],
    "parent_id": 4321,
    "version_id": 5,                    # optional; defaults to the account's default version
    "source_ref": "ABC-001",            # your own identifier — set it, you will need it later
    "code": "CS-KAL-001",
    "short_name": "CS Kalémie",
    "aliases": ["Kalemie Health Centre"],
    "validation_status": "VALID",       # defaults to "NEW" if omitted
    "opening_date": "01-03-2019",       # dd-mm-yyyy — see the warning below
    "latitude": -5.9236,
    "longitude": 29.1947,
    "altitude": 0,
    "groups": [12, 15],
})
print(new_org_unit["id"])
```

Only `name` and `org_unit_type_id` are required. A few rules the server enforces:

- `parent_id` must live in the **same source version** as the org unit being created.
- Each group in `groups` must also live in that same source version.
- `code` must be unique among valid org units of the version. A clash returns a `400` with
  `errorKey: "code"`.
- If your profile is restricted to a branch of the hierarchy, `parent_id` is mandatory — you cannot
  create a root.

For a polygon instead of a point, pass `geom` as a GeoJSON geometry object:

```python
"geom": {"type": "MultiPolygon", "coordinates": [[[[29.1, -5.9], [29.2, -5.9], [29.2, -6.0], [29.1, -5.9]]]]},
```

!!! warning "Dates on create are `dd-mm-yyyy`, and only that"
    `POST /api/orgunits/create_org_unit/` parses `opening_date` and `closed_date` with the single
    format `%d-%m-%Y`. An ISO date such as `2019-03-01` raises a server error, not a clean `400`.
    Confusingly, `PATCH` is lenient and accepts `dd-mm-yyyy`, `dd/mm/yyyy`, `yyyy-mm-dd` and
    `yyyy/mm/dd`, while change requests take **ISO `yyyy-mm-dd`**. Format the date for the endpoint
    you are calling.

    Also: if you send `closed_date` on create without an `opening_date`, the comparison between the
    two fails server-side. Always send both, or neither.

### Updating

`PATCH /api/orgunits/<id>/` updates only the keys present in the body. Everything is optional.

```python
iaso.patch(f"/api/orgunits/{org_unit_id}/", json={
    "name": "Centre de Santé de Kalémie Centre",
    "parent_id": 4322,
    "org_unit_type_id": type_by_name["Health facility"],
    "groups": [12, 15],          # replaces the full list, it is not additive
    "opening_date": "2019-03-01",  # PATCH accepts ISO too
    "code": "CS-KAL-001",
    "aliases": ["Kalemie Health Centre"],
})
```

Points of note:

- **`groups` replaces the whole list.** To add one group, read the current groups and send them all back.
- **Coordinates travel as a trio.** To set a location, send `latitude`, `longitude` *and* `altitude`
  together — the endpoint reads all three keys, and omitting `altitude` while sending the other two
  causes a server error. Send `latitude: None, longitude: None, altitude: None` to clear the location.
- **`version_id` cannot be patched.** An org unit cannot be moved between source versions through
  this API.
- An empty `name` is silently ignored rather than applied — you cannot blank out a name.

### Changing the validation status

```python
iaso.patch(f"/api/orgunits/{org_unit_id}/", json={"validation_status": "VALID"})
```

Accepted values are `NEW`, `VALID` and `REJECTED`.

### Bulk updates

For a change that applies uniformly to many org units — the same type, the same groups, the same
validation status — there is an asynchronous task rather than a loop of `PATCH` calls.

```python
task = iaso.post("/api/tasks/create/orgunitsbulkupdate/", json={
    "selected_ids": [101, 102, 103],
    "validation_status": "VALID",
    "groups_added": [15],
    "groups_removed": [12],
})["task"]

# Poll until it finishes.
import time
while True:
    status = iaso.get(f"/api/tasks/{task['id']}/")
    if status["status"] in ("SUCCESS", "ERRORED", "KILLED"):
        print(status["status"], status.get("result"))
        break
    time.sleep(5)
```

You can target a search instead of an explicit list by passing `select_all: true` together with
`searches` (the same filter objects the list endpoint accepts) and an optional `unselected_ids`.
This task cannot rename org units or move them: it only sets type, groups and validation status.

## Path B — submitting change requests

Creating a change request requires no special permission — only that you are authenticated and that
the target org unit is visible to you. What you submit is a *proposal*: it changes nothing until an
IASO reviewer approves it.

### Submitting

```python
import uuid

change_request = iaso.post("/api/orgunits/changes/", json={
    "uuid": str(uuid.uuid4()),        # optional but recommended, see below
    "org_unit_id": 1234,              # the org unit you want changed — required
    "new_name": "Centre de Santé de Kalémie Centre",
    "new_org_unit_type_id": type_by_name["Health facility"],
    "new_parent_id": 4322,
    "new_groups": [12, 15],
    "new_location": {"latitude": -5.9236, "longitude": 29.1947, "altitude": 0},
    "new_opening_date": "2019-03-01",  # ISO here
    "new_closed_date": "2030-12-31",
})
print(change_request["id"], change_request["status"])  # -> 42 new
```

The fields you may propose are exactly these:

| Field | Shape |
|---|---|
| `new_name` | string |
| `new_parent_id` | org unit id (or uuid), nullable |
| `new_org_unit_type_id` | org unit type id |
| `new_groups` | list of group ids — replaces the full list |
| `new_location` | `{"latitude": …, "longitude": …, "altitude": …}`, nullable |
| `new_location_accuracy` | decimal, in metres — metadata only, never applied to the org unit |
| `new_opening_date` | ISO date `yyyy-mm-dd` |
| `new_closed_date` | ISO date `yyyy-mm-dd` |
| `new_reference_instances` | list of form submission ids (or uuids) |

Rules the server enforces:

- **At least one `new_*` field is required.** An otherwise empty request is a `400`.
- Send only the fields you actually want changed. IASO derives the list of requested fields from the
  keys present in your payload, and the reviewer approves them one by one. Do not send a full
  snapshot of the org unit — every field you include becomes a change someone has to arbitrate.
- Sending an explicit `null` means *erase this value*, which is different from omitting the key.
- `new_parent_id` must be in the same source version as the org unit, and cannot be one of its own
  descendants.
- `new_closed_date` must be strictly later than `new_opening_date`.

### Idempotency

The `uuid` you supply is the deduplication key: posting a change request whose `uuid` already exists
is a no-op that returns the existing one instead of creating a duplicate. Derive it deterministically
from your own record — for instance `uuid.uuid5(NAMESPACE, f"{source_ref}:{content_hash}")` — and a
re-run after a network failure becomes safe.

### Proposing a new org unit

As explained at the top, a change request cannot conjure an org unit. The two-step pattern is:

```python
# 1. Create it directly, unvalidated. Requires iaso_org_units.
draft = iaso.post("/api/orgunits/create_org_unit/", json={
    "name": "Nouveau Poste de Santé",
    "org_unit_type_id": type_by_name["Health facility"],
    "parent_id": 4321,
    "source_ref": "ABC-042",
    "validation_status": "NEW",     # <- keeps it out of the live pyramid
})

# 2. Submit the change request. IASO sees the org unit is still NEW and
#    records the request with kind "org_unit_creation".
iaso.post("/api/orgunits/changes/", json={
    "org_unit_id": draft["id"],
    "new_name": "Nouveau Poste de Santé",
    "new_location": {"latitude": -5.93, "longitude": 29.20, "altitude": 0},
})
```

Approval turns the org unit `VALID` and it enters the pyramid. Rejection turns it `REJECTED` and it
stays out.

### There is no bulk create

`POST /api/orgunits/changes/` takes one change request at a time. For a hundred org units, make a
hundred calls — sequentially, or with a small thread pool, but do not expect a batch endpoint. (Bulk
*review* exists, but that is the reviewer's side, not yours.)

### Tracking what happened to your requests

```python
page = 1
while True:
    resp = iaso.get("/api/orgunits/changes/", params={
        "status": "new,approved,rejected",
        "created_at_after": "2026-01-01",
        "limit": 50,
        "page": page,
    })
    for cr in resp["results"]:
        print(cr["id"], cr["status"], cr["org_unit"]["name"], cr.get("rejection_comment"))
    if not resp["has_next"]:
        break
    page += 1
```

The list endpoint paginates under `results`. A change request is `new` until someone reviews it, then
`approved` or `rejected`; a rejection always carries a `rejection_comment` explaining why. Useful
filters: `org_unit_id`, `source_version_id`, `status`, `created_at_after` / `created_at_before`,
`kind`, `requested_fields`.

A reviewer can approve some fields and reject others, so check `approved_fields` on an approved
request rather than assuming everything you proposed was applied.

## Errors

The org unit endpoints do not return a DRF-style error object. On a `400` they return a **list**:

```json
[
  {"errorKey": "code", "errorMessage": "Another valid OrgUnit already exists with the code 'CS-KAL-001' in this version"},
  {"errorKey": "parent_id", "errorMessage": "Parent is not in the same version"}
]
```

The change request endpoint, being a standard DRF serializer, returns the usual
`{"field": ["message"]}` shape, sometimes with the message under `non_field_errors`. Handle both.

```python
def explain(err: IasoError) -> str:
    import json
    body = str(err).split(": ", 2)[-1]
    try:
        payload = json.loads(body)
    except ValueError:
        return body
    if isinstance(payload, list):     # org unit endpoints
        return "; ".join(f"{e['errorKey']}: {e['errorMessage']}" for e in payload)
    return "; ".join(f"{k}: {v}" for k, v in payload.items())   # change requests
```

Do not blindly retry a `400` — it is a rejected payload, and it will be rejected again. Retry `502`,
`503` and `504`, and make your writes idempotent (a stable `uuid` for change requests, a lookup on
`source_ref` before creating) so that a retry after a timeout cannot double-write.

## A complete example: syncing a CSV of facilities

The script below reads a CSV exported from your own system, matches each row against IASO on
`source_ref`, then creates what is missing and updates what has drifted. The same logic runs in
either mode: `direct` writes straight to the pyramid, `change_request` proposes.

```python
"""Sync a CSV of health facilities into an IASO data source.

Usage:
    python sync_org_units.py facilities.csv direct
    python sync_org_units.py facilities.csv change_request

CSV columns: source_ref, name, parent_ref, type, latitude, longitude, opening_date (yyyy-mm-dd)
"""

import csv
import sys
import uuid

# IasoClient and IasoError as defined earlier in this guide.
from iaso_client import IasoClient, IasoError

SERVER = "https://iaso.example.org"
USERNAME = "my-service-account"
PASSWORD = "..."
VERSION_ID = 5          # the source version you write into
NAMESPACE = uuid.UUID("6c1f0e6e-0f1a-4c6e-9f4a-2b7d0a1f0000")  # any fixed uuid of your own


def load_existing(iaso, version_id):
    """Every org unit of the version, indexed by source_ref."""
    by_ref, page = {}, 1
    while True:
        resp = iaso.get("/api/orgunits/", params={
            "version": version_id,
            "validation_status": "all",   # otherwise NEW and REJECTED units are invisible
            "limit": 500,
            "page": page,
        })
        for org_unit in resp["orgunits"]:
            if org_unit.get("source_ref"):
                by_ref[org_unit["source_ref"]] = org_unit
        if not resp["has_next"]:
            return by_ref
        page += 1


def load_types(iaso):
    return {t["name"]: t["id"] for t in iaso.get("/api/orgunittypes/")["orgUnitTypes"]}


def has_drifted(row, existing, type_ids, parent_id):
    """Fields where the CSV disagrees with IASO, in IASO's own vocabulary."""
    changes = {}
    if row["name"] != existing["name"]:
        changes["name"] = row["name"]
    if type_ids[row["type"]] != existing.get("org_unit_type_id"):
        changes["org_unit_type_id"] = type_ids[row["type"]]
    if parent_id != existing.get("parent_id"):
        changes["parent_id"] = parent_id
    if row.get("latitude") and row.get("longitude"):
        lat, lon = float(row["latitude"]), float(row["longitude"])
        if (existing.get("latitude"), existing.get("longitude")) != (lat, lon):
            changes["latitude"], changes["longitude"] = lat, lon
    return changes


def to_iso(date_str):        # PATCH and change requests both accept ISO
    return date_str or None


def to_ddmmyyyy(date_str):   # create_org_unit accepts only dd-mm-yyyy
    if not date_str:
        return None
    year, month, day = date_str.split("-")
    return f"{day}-{month}-{year}"


def create_direct(iaso, row, type_ids, parent_id):
    return iaso.post("/api/orgunits/create_org_unit/", json={
        "name": row["name"],
        "org_unit_type_id": type_ids[row["type"]],
        "parent_id": parent_id,
        "version_id": VERSION_ID,
        "source_ref": row["source_ref"],
        "validation_status": "VALID",
        "opening_date": to_ddmmyyyy(row.get("opening_date")),
        "latitude": float(row["latitude"]) if row.get("latitude") else None,
        "longitude": float(row["longitude"]) if row.get("longitude") else None,
        "altitude": 0,
    })


def update_direct(iaso, org_unit, changes):
    payload = dict(changes)
    if "latitude" in payload:
        payload["altitude"] = 0       # the endpoint reads all three keys together
    return iaso.patch(f"/api/orgunits/{org_unit['id']}/", json=payload)


def create_as_change_request(iaso, row, type_ids, parent_id):
    """Create the org unit unvalidated, then propose it. Needs iaso_org_units."""
    draft = iaso.post("/api/orgunits/create_org_unit/", json={
        "name": row["name"],
        "org_unit_type_id": type_ids[row["type"]],
        "parent_id": parent_id,
        "version_id": VERSION_ID,
        "source_ref": row["source_ref"],
        "validation_status": "NEW",
        "opening_date": to_ddmmyyyy(row.get("opening_date")),
    })
    return submit_change_request(iaso, draft["id"], row, {
        "name": row["name"],
        "latitude": float(row["latitude"]) if row.get("latitude") else None,
        "longitude": float(row["longitude"]) if row.get("longitude") else None,
    })


def submit_change_request(iaso, org_unit_id, row, changes):
    """Translate the drifted fields into the change request vocabulary."""
    payload = {
        "uuid": str(uuid.uuid5(NAMESPACE, f"{row['source_ref']}:{sorted(changes.items())}")),
        "org_unit_id": org_unit_id,
    }
    if "name" in changes:
        payload["new_name"] = changes["name"]
    if "org_unit_type_id" in changes:
        payload["new_org_unit_type_id"] = changes["org_unit_type_id"]
    if "parent_id" in changes:
        payload["new_parent_id"] = changes["parent_id"]
    if changes.get("latitude") is not None:
        payload["new_location"] = {
            "latitude": changes["latitude"],
            "longitude": changes["longitude"],
            "altitude": 0,
        }
    if row.get("opening_date"):
        payload["new_opening_date"] = to_iso(row["opening_date"])
    return iaso.post("/api/orgunits/changes/", json=payload)


def main(csv_path, mode):
    iaso = IasoClient(SERVER, USERNAME, PASSWORD)
    type_ids = load_types(iaso)
    existing = load_existing(iaso, VERSION_ID)

    created = updated = unchanged = failed = 0

    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            parent = existing.get(row.get("parent_ref"))
            parent_id = parent["id"] if parent else None
            current = existing.get(row["source_ref"])

            try:
                if current is None:
                    if mode == "direct":
                        create_direct(iaso, row, type_ids, parent_id)
                    else:
                        create_as_change_request(iaso, row, type_ids, parent_id)
                    created += 1
                    continue

                changes = has_drifted(row, current, type_ids, parent_id)
                if not changes:
                    unchanged += 1
                    continue

                if mode == "direct":
                    update_direct(iaso, current, changes)
                else:
                    submit_change_request(iaso, current["id"], row, changes)
                updated += 1

            except IasoError as e:
                failed += 1
                print(f"FAILED {row['source_ref']}: {e}", file=sys.stderr)

    verb = "created" if mode == "direct" else "proposed"
    print(f"{verb}: {created}, updated: {updated}, unchanged: {unchanged}, failed: {failed}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
```

Two habits this script illustrates and that are worth keeping:

**Always carry your own identifier in `source_ref`.** It is the join key between your system and
IASO, it survives renames, and it lets you re-run the sync without creating duplicates. IASO will
happily create two org units with the same name.

**Build parents before children.** The script above resolves a parent from the org units already in
IASO, so a CSV must be sorted top-down — a facility whose district does not exist yet gets a `null`
parent. If you are importing a whole hierarchy, process it level by level.

## Other bulk paths

If you are loading an entire pyramid rather than maintaining one, two heavier import routes exist and
are usually a better fit. Both need the `iaso_sources` permission, both run as background tasks, and
both are documented alongside the data source administration screens:

- `POST /api/tasks/create/importgpkg/` — upload a GeoPackage into a data source and a version number.
- `POST /api/dhis2ouimporter/` — import or refresh the pyramid straight from a DHIS2 instance.

## Quick reference of the traps

- The org unit list defaults to `validation_status=VALID`; pass `all` to see what you just created.
- The list envelope is `orgunits` when paginated, `orgUnits` when not.
- Dates: `dd-mm-yyyy` on create, anything reasonable on `PATCH`, ISO `yyyy-mm-dd` on change requests.
- On create, never send `closed_date` without `opening_date`.
- Latitude, longitude and altitude are read as a trio on both `PATCH` and `new_location`.
- `groups` and `new_groups` replace the whole list; they do not append.
- A parent and a group must belong to the same source version as the org unit.
- `version_id` is set once, at creation, and can never be patched.
- A change request always needs an existing `org_unit_id`, and there is no bulk-create for them.
