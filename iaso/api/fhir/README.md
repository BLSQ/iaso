# FHIR Location API

This module provides a FHIR R4 compliant Location resource API that maps Iaso OrgUnit objects to FHIR Location resources.

## Overview

The FHIR Location API allows external systems to access Iaso organizational units using the standard FHIR Location resource format. This enables interoperability with other health information systems that support FHIR.

## API Endpoints

### Base URL
All FHIR endpoints are available under: `/fhir/`

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/fhir/Location/` | List all locations (returns FHIR Bundle) |
| GET | `/fhir/Location/{id}/` | Get a specific location by ID |
| GET | `/fhir/Location/{id}/children/` | Get child locations of a specific location |
| GET | `/fhir/Location/metadata/` | Get FHIR CapabilityStatement |

## Authentication

All endpoints require authentication. Users must have the `iaso_org_units` permission to access location data.

## FHIR Location Resource Mapping

### OrgUnit → FHIR Location Mapping

| Iaso OrgUnit Field | FHIR Location Field | Notes |
|-------------------|-------------------|-------|
| `id` | `id` | Converted to string |
| `name` | `name` | Direct mapping |
| `validation_status` | `status` | NEW→suspended, VALID→active, REJECTED→inactive |
| `source_ref` | `identifier` | With system `http://openiaso.com/org-unit/{datasource}/source-ref` |
| `uuid` | `identifier` | With system `http://openiaso.com/org-unit/uuid` |
| `aliases` | `identifier` | Multiple entries with system `http://openiaso.com/org-unit/alias` |
| `org_unit_type` | `type` | With system `http://openiaso.com/org-unit-type` |
| `org_unit_type.category` | `physicalType` | COUNTRY→co, REGION/DISTRICT→area, HF→bu |
| `location` | `position` | Geographic coordinates (longitude, latitude, altitude) |
| `parent` | `partOf` | Reference to parent location |
| `version.data_source` | `managingOrganization` | Data source name |
| `opening_date/closed_date` | `operationalStatus` | Open/Closed status |

### Extensions

Custom extensions are used for Iaso-specific data:

- `http://openiaso.com/fhir/StructureDefinition/org-unit-validation-status` - Validation status
- `http://openiaso.com/fhir/StructureDefinition/org-unit-type-depth` - Organization unit type depth
- `http://openiaso.com/fhir/StructureDefinition/source-version` - Source version number
- `http://openiaso.com/fhir/StructureDefinition/opening-date` - Opening date
- `http://openiaso.com/fhir/StructureDefinition/closed-date` - Closing date

## Search Parameters

The API supports the following FHIR search parameters:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `name` | string | Search by location name (case-insensitive) | `?name=hospital` |
| `status` | token | Search by status (active\|suspended\|inactive) | `?status=active` |
| `identifier` | token | Search by any identifier (source_ref, uuid, alias) | `?identifier=HF001` |
| `type` | token | Search by org unit type | `?type=HF` |
| `_count` | number | Number of results per page (max 100) | `?_count=50` |
| `_skip` | number | Number of results to skip for pagination | `?_skip=20` |

## Examples

### List All Locations

```http
GET /fhir/Location/
```

Response:
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 150,
  "entry": [
    {
      "resource": {
        "resourceType": "Location",
        "id": "123",
        "name": "Central Hospital",
        "status": "active",
        "mode": "instance",
        "type": [{
          "coding": [{
            "system": "http://openiaso.com/org-unit-type",
            "code": "HF",
            "display": "Health Facility"
          }]
        }],
        "position": {
          "longitude": -1.5678,
          "latitude": 12.3456
        }
      },
      "fullUrl": "https://api.example.com/fhir/Location/123"
    }
  ]
}
```

### Get Specific Location

```http
GET /fhir/Location/123/
```

Response:
```json
{
  "resourceType": "Location",
  "id": "123",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2024-01-15T10:30:00Z",
    "profile": ["http://hl7.org/fhir/StructureDefinition/Location"]
  },
  "identifier": [
    {
      "use": "official",
      "system": "http://openiaso.com/org-unit/national-system/source-ref",
      "value": "HF001"
    },
    {
      "use": "secondary",
      "system": "http://openiaso.com/org-unit/uuid",
      "value": "uuid-123-456-789"
    }
  ],
  "status": "active",
  "name": "Central Hospital",
  "mode": "instance",
  "type": [{
    "coding": [{
      "system": "http://openiaso.com/org-unit-type",
      "code": "HF",
      "display": "Health Facility"
    }],
    "text": "Health Facility"
  }],
  "physicalType": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/location-physical-type",
      "code": "bu"
    }]
  },
  "position": {
    "longitude": -1.5678,
    "latitude": 12.3456,
    "altitude": 1250.0
  },
  "partOf": {
    "reference": "Location/122",
    "display": "Central District"
  },
  "managingOrganization": {
    "display": "National Health System"
  },
  "extension": [
    {
      "url": "http://openiaso.com/fhir/StructureDefinition/org-unit-validation-status",
      "valueCode": "VALID"
    },
    {
      "url": "http://openiaso.com/fhir/StructureDefinition/org-unit-type-depth",
      "valueInteger": 3
    }
  ]
}
```

### Search by Name

```http
GET /fhir/Location/?name=hospital
```

### Search by Status

```http
GET /fhir/Location/?status=active
```

### Get Child Locations

```http
GET /fhir/Location/122/children/
```

### Pagination

```http
GET /fhir/Location/?_count=25&_skip=50
```

## Error Handling

The API returns standard FHIR OperationOutcome resources for errors:

```json
{
  "resourceType": "OperationOutcome",
  "issue": [{
    "severity": "error",
    "code": "not-found",
    "details": {
      "text": "Location with id '999' not found"
    }
  }]
}
```

## Standards Compliance

This API follows FHIR R4 specifications:
- [FHIR Location Resource](https://build.fhir.org/location.html)
- [FHIR Bundle Resource](https://build.fhir.org/bundle.html)
- [FHIR Search](https://build.fhir.org/search.html)
- [FHIR RESTful API](https://build.fhir.org/http.html)

## Implementation Details

### Architecture

The API is implemented using Django REST Framework with:

- **ViewSet**: `FHIRLocationViewSet` - Handles HTTP requests
- **Serializer**: `FHIRLocationSerializer` - Converts OrgUnit to FHIR Location
- **Filters**: `FHIRLocationFilter` - Implements FHIR search parameters
- **Pagination**: `FHIRPagination` - FHIR-compliant pagination
- **Permissions**: `FHIRLocationPermission` - Authentication and authorization

### Performance Considerations

- Queries use `select_related()` and `prefetch_related()` for optimization
- Pagination limits maximum page size to 100 resources
- User-based filtering ensures data isolation

### Testing

Comprehensive test suite includes:
- FHIR Bundle structure validation
- Individual Location resource validation
- Search parameter functionality
- Pagination testing
- Permission and authentication testing
- Error condition handling

Run tests with:
```bash
python manage.py test iaso.api.fhir.tests
```