# Read org units through the FHIR API

IASO exposes its org units as **FHIR R4 `Location` resources**, for external systems that already
speak FHIR. This guide documents that API as it is actually implemented.

It is a **read-only** API: it serves `GET` only, and there is no way to create or modify an org unit
through it. To write, use the [guide to modifying org units via the
API](../modify_org_units_via_api/modify_org_units_via_api.md).

## What is and is not implemented

Be clear-eyed about the scope before you plan an integration around it.

**Implemented:** the `Location` resource (read and search), a `children` operation, a
`CapabilityStatement`, `Bundle` responses of type `searchset`, and `OperationOutcome` on errors.

**Not implemented:** any other FHIR resource — there is no `Organization`, `Patient`, `Encounter`,
`Observation` or `QuestionnaireResponse` endpoint. No writes (`POST`/`PUT`/`PATCH`/`DELETE`). No
`_include`, `_revinclude`, `_sort`, `_elements`, `_summary`, `_lastUpdated`, chained parameters, or
modifiers such as `:exact` and `:contains`. No XML, and no `_format` parameter. No `$everything` or
other FHIR operations beyond `children`.

In practice this is a FHIR-shaped read view of the org unit pyramid, not a full FHIR server. If your
client is a strict, general-purpose FHIR client, read the [conformance
caveats](#conformance-caveats) at the bottom first — several responses will not validate cleanly.

## Endpoints

The FHIR routes live under IASO's `/api/` prefix, like every other IASO endpoint.

| Method | Path | Returns |
|---|---|---|
| `GET` | `/api/fhir/Location/` | `Bundle` (`searchset`) of `Location` resources |
| `GET` | `/api/fhir/Location/{id}/` | a single `Location` |
| `GET` | `/api/fhir/Location/{id}/children/` | `Bundle` of the **direct** children of that location |
| `GET` | `/api/fhir/Location/metadata/` | `CapabilityStatement` |

!!! warning "The base path is `/api/fhir/`, not `/fhir/`"
    The module's own `README.md` in `iaso/api/fhir/` documents the base URL as `/fhir/`. That is
    wrong: the router is registered inside `iaso/urls.py`, which is mounted under `/api/`. Every path
    is `/api/fhir/Location/…`. The same README also has the status mapping backwards and writes the
    identifier systems with `http://` instead of `https://` — prefer this page over it.

Note that `metadata` sits **under** `Location`, at `/api/fhir/Location/metadata/`. The FHIR
specification puts the capability statement at the server root (`/metadata`); IASO does not. A
generic FHIR client that auto-discovers conformance will not find it.

## Authentication and permissions

Authentication is IASO's standard JWT — the FHIR endpoints are not public and not separately
credentialed.

```python
import requests

SERVER = "https://iaso.example.org"

r = requests.post(
    f"{SERVER}/api/token/",
    json={"username": "my-service-account", "password": "..."},
    timeout=30,
)
r.raise_for_status()
headers = {"Authorization": f"Bearer {r.json()['access']}"}
```

The caller needs **either `iaso_org_units` or `iaso_org_units_read`**. The read-only permission is
enough, and it is the right one to ask for if you only consume this API. Superusers bypass the
permission check.

- Unauthenticated → `401`.
- Authenticated but holding neither permission → `403`.

### What you are allowed to see

Results are scoped to the caller in two ways, and both are silent:

- **Account isolation.** You only ever see org units belonging to your own account. This is not
  bypassed by superuser status.
- **Profile hierarchy restriction.** If the IASO administrator restricted your user profile to a
  branch of the pyramid, you see that branch and its descendants, and nothing else — not the parent
  above it, not sibling branches.

Asking for an org unit outside your scope returns **`404` with an `OperationOutcome`, not `403`**.
The API does not distinguish "does not exist" from "not yours", which is deliberate but means a `404`
is not proof that an id is unused.

## The Bundle

The list and `children` endpoints both return a `searchset` Bundle.

```json
{
  "resourceType": "Bundle",
  "id": "search-results",
  "meta": {"lastUpdated": "2026-07-14T10:30:00.123456+00:00"},
  "type": "searchset",
  "total": 150,
  "link": [
    {"relation": "self", "url": "https://iaso.example.org/api/fhir/Location/?_count=20"},
    {"relation": "next", "url": "https://iaso.example.org/api/fhir/Location/?_count=20&_skip=20"}
  ],
  "entry": [
    {
      "resource": { "resourceType": "Location", "id": "123", "...": "..." },
      "fullUrl": "https://iaso.example.org/api/fhir/Location//123"
    }
  ]
}
```

`total` is the count of the **whole** result set, not of the current page. `link` carries `self`,
plus `next` and `previous` when they exist — follow `next` rather than computing offsets yourself.
Note the relation is spelled `previous`, not FHIR's `prev`. For the `children` endpoint the Bundle
`id` is `children-{parent_id}` instead of `search-results`.

The double slash in `fullUrl` is not a typo in this guide — the implementation joins a base URL that
already ends in `/` with `/{id}`. Do not parse ids out of `fullUrl`; read `entry[].resource.id`.

!!! danger "Paging is not stable — deduplicate by `id`"
    The underlying query has **no ordering**: `OrgUnit` declares no default sort and the FHIR viewset
    adds none, yet results are paged with a limit/offset scheme. PostgreSQL is free to return rows in
    a different order on each query, so paging through a large result set **can show you the same org
    unit twice and skip another entirely**. There is no `_sort` parameter to fix this.

    Two practical mitigations, both used in the examples below: request the largest page you can
    (`_count=100`) to minimise the number of round trips, and **deduplicate by `id`** as you go rather
    than trusting that each page is disjoint. If you need a guaranteed-complete snapshot of a large
    pyramid, `/api/orgunits/` is the safer read path.

    Everything served in a single page (any result set of 100 or fewer, and most `children` calls) is
    unaffected.

## The Location resource

A full example, for a health facility with a parent, coordinates and dates:

```json
{
  "resourceType": "Location",
  "id": "123",
  "meta": {
    "versionId": "1",
    "profile": ["https://hl7.org/fhir/StructureDefinition/Location"],
    "lastUpdated": "2026-07-14T10:30:00.123456+00:00"
  },
  "identifier": [
    {"use": "official", "system": "https://openiaso.com/org-unit/National pyramid/source-ref", "value": "HF001"},
    {"use": "secondary", "system": "https://openiaso.com/org-unit/uuid", "value": "country-uuid-123"},
    {"use": "secondary", "system": "https://openiaso.com/org-unit/alias", "value": "TC"}
  ],
  "status": "active",
  "name": "Test Health Facility",
  "mode": "instance",
  "type": [
    {
      "coding": [
        {"system": "https://openiaso.com/org-unit-type", "code": "HF", "display": "Health Facility"}
      ],
      "text": "Health Facility"
    }
  ],
  "physicalType": {
    "coding": [{"system": "https://terminology.hl7.org/CodeSystem/location-physical-type", "code": "bu"}]
  },
  "position": {"longitude": 29.1947, "latitude": -5.9236, "altitude": 0.0},
  "partOf": {"reference": "Location/122", "display": "Test District"},
  "managingOrganization": {"display": "National pyramid"},
  "operationalStatus": {
    "coding": [{"system": "https://terminology.hl7.org/CodeSystem/v2-0116", "code": "O", "display": "Open"}]
  },
  "extension": [
    {"url": "https://openiaso.com/fhir/StructureDefinition/org-unit-validation-status", "valueCode": "VALID"},
    {"url": "https://openiaso.com/fhir/StructureDefinition/org-unit-type-depth", "valueInteger": 3},
    {"url": "https://openiaso.com/fhir/StructureDefinition/source-version", "valueString": "1"},
    {"url": "https://openiaso.com/fhir/StructureDefinition/opening-date", "valueDate": "2019-03-01"}
  ]
}
```

### Field by field

| FHIR field | Comes from | Notes |
|---|---|---|
| `id` | `OrgUnit.id` | a string, not a number |
| `meta.versionId` | — | hardcoded to `"1"`; it does not track revisions |
| `meta.lastUpdated` | `updated_at` | ISO 8601 |
| `identifier` | `source_ref`, `uuid`, `aliases` | see below |
| `status` | `validation_status` | see the mapping below — **read it carefully** |
| `name` | `name` | |
| `mode` | — | always `"instance"` |
| `type[].coding[].code` | `org_unit_type.short_name` | the **short name**, e.g. `HF` |
| `type[].coding[].display`, `type[].text` | `org_unit_type.name` | e.g. `Health Facility` |
| `physicalType` | `org_unit_type.category` | `COUNTRY`→`co`, `REGION`/`DISTRICT`→`area`, `HF`→`bu`, anything else→`si` |
| `position` | `location` | `longitude`, `latitude`, and `altitude` when the point carries a Z |
| `partOf` | `parent` | `{"reference": "Location/<id>", "display": "<parent name>"}` |
| `managingOrganization.display` | `version.data_source.name` | a display string only — there is no `Organization` resource to reference |
| `operationalStatus` | `closed_date` / `opening_date` | `C`/Closed if a closed date exists, else `O`/Open if an opening date exists, else absent |
| `extension` | validation status, type depth, source version, opening and closed dates | see below |

The `identifier` array holds up to three kinds of entry, and only those that are set:

- the **source reference**, with `use: "official"` and a system that embeds the data source name:
  `https://openiaso.com/org-unit/{data source name}/source-ref`. Because the name is interpolated
  into the system URL, the system string differs per data source and may contain spaces.
- the **IASO uuid**, with `use: "secondary"` and system `https://openiaso.com/org-unit/uuid`.
- one entry **per alias**, with `use: "secondary"` and system `https://openiaso.com/org-unit/alias`.

The `extension` array carries the IASO-specific data that has no FHIR home:

| Extension URL (prefix `https://openiaso.com/fhir/StructureDefinition/`) | Value | Present when |
|---|---|---|
| `org-unit-validation-status` | `valueCode`: `NEW` \| `VALID` \| `REJECTED` | always |
| `org-unit-type-depth` | `valueInteger` | the type has a depth |
| `source-version` | `valueString` — the version **number**, not its id | the org unit has a version |
| `opening-date` | `valueDate` | set |
| `closed-date` | `valueDate` | set |

If you care about the true IASO validation status, read the `org-unit-validation-status` extension
rather than inferring it from `status` — it is the unmapped, unambiguous value.

### The status mapping

`Location.status` is a FHIR-constrained code, so IASO's three validation statuses are squeezed into
it like this:

| IASO `validation_status` | FHIR `Location.status` |
|---|---|
| `VALID` | `active` |
| `NEW` | `inactive` |
| `REJECTED` | `suspended` |

!!! danger "This is counter-intuitive, and the module README states it backwards"
    A **rejected** org unit surfaces as `suspended`, and a **new / not-yet-validated** one surfaces as
    `inactive`. It is easy to assume the opposite. `iaso/api/fhir/README.md` documents exactly the
    reverse mapping and is wrong; the code and its tests agree with the table above.

    Filtering on `?status=active` is therefore the way to get only validated org units — which is
    also what most integrations want.

## Search parameters

All parameters apply to `GET /api/fhir/Location/`.

| Parameter | Type | Semantics |
|---|---|---|
| `name` | string | case-insensitive **substring** match on the org unit name |
| `status` | token | `active` \| `inactive` \| `suspended`, mapped as above. An unknown value returns a plain `400`, not an `OperationOutcome` |
| `identifier` | token | **exact** match against `source_ref`, or `uuid`, or any alias |
| `type` | token | **exact** match on the org unit type's `short_name` (e.g. `HF`, not `Health Facility`), case-sensitive |
| `search` | string | substring match on the name; a DRF convention, equivalent to `name` here |
| `_count` | number | page size. Default **20**, maximum **100** — asking for more silently gives you 100 |
| `_skip` | number | offset |

Filters combine with AND.

`identifier` is the parameter to use when resolving your own external references to IASO ids: it
matches `source_ref` exactly, which is the field an IASO integration normally populates with the
identifier from the source system. Pass the **bare value** — the FHIR `system|value` token syntax is
not parsed, and a query like `?identifier=https://openiaso.com/org-unit/uuid|abc` simply matches
nothing.

There is no filter on parent, source version, date, or group, and no `_sort`, `_id`, `_lastUpdated`,
`_include`, `_elements` or `_summary`. To walk the tree, use `children`.

!!! warning "Results span every source version your account can see"
    There is no way to restrict a FHIR search to one data source or source version. If your account
    holds several pyramids, or several versions of the same one, they all appear in the same result
    set — and the same real-world facility may legitimately appear more than once, as a distinct
    `Location` per version. The `source-version` extension on each resource is the only way to tell
    them apart. If this matters to you, filter client-side on that extension, or read the org units
    through [`/api/orgunits/`](../modify_org_units_via_api/modify_org_units_via_api.md#reading-org-units)
    instead, which does take a `version` parameter.

## Walking the hierarchy

```
GET /api/fhir/Location/{id}/children/
```

Returns a Bundle of the **direct** children only — it is one level, not the whole subtree. To
traverse a pyramid, recurse.

## Python examples

Using the same `IasoClient` as the [org unit write
guide](../modify_org_units_via_api/modify_org_units_via_api.md#a-small-client-to-build-on):

### Page through every Location

Follow the `next` link rather than incrementing `_skip` yourself, and deduplicate as you go — paging
is not stably ordered, so a resource can legitimately appear on two consecutive pages.

```python
def iter_locations(iaso, **params):
    """Yield every Location resource exactly once, following the Bundle's next links."""
    params.setdefault("_count", 100)          # 100 is the server-side maximum
    bundle = iaso.get("/api/fhir/Location/", params=params)
    seen = set()

    while True:
        for entry in bundle.get("entry", []):
            location = entry["resource"]
            if location["id"] in seen:        # paging is unordered; duplicates happen
                continue
            seen.add(location["id"])
            yield location

        next_link = next(
            (l["url"] for l in bundle.get("link", []) if l["relation"] == "next"),
            None,
        )
        if not next_link:
            return
        # next_link is an absolute URL; hand it back to the session as-is.
        bundle = iaso.session.get(next_link, timeout=60).json()


for location in iter_locations(iaso, status="active", type="HF"):
    print(location["id"], location["name"])
```

Deduplicating protects you against seeing a resource twice, but nothing at the API level protects you
against *missing* one. If completeness is critical, compare the number of unique ids you collected
against the Bundle's `total`, and fall back to `/api/orgunits/` if they disagree.

### Resolve one of your own references to an IASO id

```python
def find_by_source_ref(iaso, source_ref):
    bundle = iaso.get("/api/fhir/Location/", params={"identifier": source_ref})
    entries = bundle.get("entry", [])
    if not entries:
        return None
    return entries[0]["resource"]

location = find_by_source_ref(iaso, "HF001")
if location:
    print(location["id"], location["name"], location["status"])
```

### Walk the tree depth-first

```python
def walk(iaso, root_id, depth=0):
    location = iaso.get(f"/api/fhir/Location/{root_id}/")
    print("  " * depth + f"{location['name']} ({location['status']})")

    bundle = iaso.get(f"/api/fhir/Location/{root_id}/children/", params={"_count": 100})
    for entry in bundle.get("entry", []):
        walk(iaso, entry["resource"]["id"], depth + 1)
```

Note this issues one request per node. For a whole pyramid, listing everything once with
`iter_locations()` and rebuilding the tree in memory from `partOf` is far cheaper:

```python
def build_tree(iaso):
    children_by_parent = {}
    for location in iter_locations(iaso):
        part_of = location.get("partOf") or {}
        reference = part_of.get("reference")            # "Location/122" or absent for a root
        parent_id = reference.split("/")[1] if reference else None
        children_by_parent.setdefault(parent_id, []).append(location)
    return children_by_parent                           # key None holds the roots
```

### Read the true IASO validation status

```python
VALIDATION_STATUS = "https://openiaso.com/fhir/StructureDefinition/org-unit-validation-status"

def validation_status(location):
    for ext in location.get("extension", []):
        if ext["url"] == VALIDATION_STATUS:
            return ext["valueCode"]      # "NEW" | "VALID" | "REJECTED"
    return None
```

## Errors

A missing — or out-of-scope — location returns `404` with a FHIR `OperationOutcome`:

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "not-found",
      "details": {"text": "Location with id '999' not found"}
    }
  ]
}
```

`401` and `403` are plain DRF errors, **not** `OperationOutcome` resources, so do not assume every
error body carries a `resourceType`.

## Conformance caveats

The API is FHIR R4-shaped and declares `fhirVersion: "4.0.1"` in its capability statement, but a
strict FHIR client will notice the following. None of them are blockers if you are writing the client
yourself; all of them matter if you are pointing an off-the-shelf FHIR tool at it.

- **Empty elements are emitted as `{}` or `[]` rather than omitted.** An org unit with no
  coordinates still returns `"position": {}`; one with no parent returns `"partOf": {}`; likewise
  `physicalType`, `managingOrganization`, `operationalStatus` and `type`. FHIR expects absent
  elements to be left out, and a validator will reject `"position": {}` because `longitude` and
  `latitude` are required once `position` is present. **Test for truthiness, not for key presence.**
- **Do not send `Accept: application/fhir+json` — you will get a `406`.** The endpoints are served by
  the ordinary JSON renderer, which does not advertise the FHIR media type, so content negotiation
  fails outright. Send `Accept: application/json` (or nothing at all). Responses come back as
  `Content-Type: application/json`.
- **The terminology systems are spelled `https://`**, e.g.
  `https://terminology.hl7.org/CodeSystem/location-physical-type`. HL7's canonical system URIs use
  `http://`, and a system URI is an opaque identifier rather than a URL to dereference — so these
  codings will **not** match a standard terminology server or a validator expecting the canonical
  form. The same applies to `meta.profile`, given as `https://hl7.org/fhir/StructureDefinition/Location`.
- **The capability statement is at `/api/fhir/Location/metadata/`**, not at the server root
  `/metadata`, and it **requires authentication** — both non-standard, so conformance auto-discovery
  fails. It also omits R4-required elements (`url`, `version`, `name`), and the `OperationDefinition`
  it references for `children` is not actually served anywhere.
- **`meta.versionId` is always `"1"`** and there is no `_history`; the resource is not versioned. With
  no `_lastUpdated` search parameter either, **there is no delta-sync story** — you re-read
  everything, every time.
- **The identifier `system` for a source reference embeds the data source name**, so it is not a
  stable, opaque URI and may contain spaces. Match on `use == "official"` or on the value, never on
  the system string.
- **`managingOrganization` has a `display` but no `reference`**, because there is no `Organization`
  endpoint to point at.
- **`operationalStatus` is wrapped in `{"coding": [...]}`**, whereas FHIR types it as a bare `Coding`.
  A closed date always wins over an opening date, even one set in the future.
- **`fullUrl` contains a double slash** (`.../Location//123`).

One operational note that is not a conformance issue: the service account you authenticate with must
have an IASO profile attached. A user without one — which is possible for a bare superuser created
outside the normal flow — causes a `500` rather than a clean error.

## Quick reference of the traps

- The base path is `/api/fhir/Location/`, **not** `/fhir/Location/` as the module README says.
- `NEW` → `inactive` and `REJECTED` → `suspended`, not the reverse. The module README has these swapped.
- Paging is **not stably ordered** — deduplicate by `id` and check your count against `total`.
- `Accept: application/fhir+json` is rejected with a `406`. Ask for `application/json`.
- Identifier and terminology systems use `https://`, not HL7's canonical `http://`.
- Out-of-scope org units return `404`, not `403` — a `404` does not mean the id is free.
- Results span every source version your account can see; there is no version filter.
- `type` matches the org unit type's **short name**, not its display name.
- `identifier` takes a bare value; the `system|value` token syntax matches nothing.
- An invalid `status` returns a plain `400`, not an `OperationOutcome`.
- `_count` caps at 100 and silently clamps; default page size is 20.
- `children` returns direct children only, one level at a time.
- Absent fields come back as `{}` / `[]`, not omitted — check truthiness.
- Read `status` for the FHIR view, and the `org-unit-validation-status` extension for IASO's real one.
