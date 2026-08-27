# FHIR API - Organization Units

IASO exposes Organization Units through a [FHIR R4](https://build.fhir.org/location.html)-compliant API, mapping them to the standard FHIR `Location` resource. This lets external systems that support FHIR - health information exchanges, national facility registries, EHRs - read IASO's organizational structure without a custom integration.

This API is **read-only**.

## Authentication

All endpoints require authentication and the `iaso_org_units` permission.

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/fhir/Location/` | List locations (returns a FHIR `Bundle`) |
| GET | `/fhir/Location/{id}/` | Get a specific location |
| GET | `/fhir/Location/{id}/children/` | Get the children of a location |
| GET | `/fhir/Location/metadata/` | FHIR `CapabilityStatement` describing this API |

## Field mapping

| IASO Organization Unit | FHIR Location field |
|---|---|
| `id` | `id` |
| `name` | `name` |
| `validation_status` (NEW / VALID / REJECTED) | `status` (suspended / active / inactive) |
| `source_ref`, `uuid`, `aliases` | `identifier` |
| `org_unit_type` | `type` |
| `org_unit_type.category` | `physicalType` |
| `location` (GPS) | `position` |
| `parent` | `partOf` |
| `version.data_source` | `managingOrganization` |

IASO-specific data without a native FHIR field - validation status, org unit type depth, source version, opening/closing dates - is carried as custom extensions under the `http://openiaso.com/fhir/StructureDefinition/...` namespace.

## Searching

| Parameter | Description | Example |
|---|---|---|
| `name` | Case-insensitive name search | `?name=hospital` |
| `status` | `active`, `suspended`, or `inactive` | `?status=active` |
| `identifier` | Matches source_ref, uuid, or alias | `?identifier=HF001` |
| `type` | Organization unit type | `?type=HF` |
| `_count` | Page size (max 100) | `?_count=50` |
| `_skip` | Pagination offset | `?_skip=20` |

## Example

```http
GET /fhir/Location/?name=hospital&status=active&_count=25
```

Returns a FHIR `Bundle` of matching `Location` resources - see the [FHIR Location](https://build.fhir.org/location.html) and [FHIR Search](https://build.fhir.org/search.html) specs for the full resource and query shape.

## Errors

Errors follow the FHIR `OperationOutcome` format rather than IASO's usual API error shape.
