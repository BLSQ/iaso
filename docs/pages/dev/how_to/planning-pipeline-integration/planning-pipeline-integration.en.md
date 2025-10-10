# Planning-Pipeline Integration Documentation

## Overview

This document describes the integration between Iaso's Planning feature and OpenHexa pipelines for automated assignment generation. The integration allows users to configure sampling parameters and automatically generate assignments of organizational units to teams/users using LQAS (Lot Quality Assurance Sampling) algorithms.

## Architecture Overview

### Core Components

1. **Planning System**: Manages planning configurations and assignment results
2. **OpenHexa Integration**: Handles pipeline execution and task management
3. **Assignment Engine**: Generates assignments based on pipeline results
4. **UI Components**: Frontend interfaces for configuration and monitoring

### Data Flow

```
Planning Configuration → Pipeline Parameters → OpenHexa Execution → Assignment Generation → UI Display
```

## Data Models

### Planning **Model**

```python
class Planning(SoftDeletableModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    project = models.ForeignKey(Project, on_delete=models.PROTECT)
    started_at = models.DateField(null=True, blank=True)
    ended_at = models.DateField(null=True, blank=True)
    forms = models.ManyToManyField(Form, related_name="plannings")
    team = models.ForeignKey(Team, on_delete=models.CASCADE)  # Main team
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.PROTECT)  # Root org unit (usually country)
    published_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    pipeline_uuids = ArrayField(
        models.CharField(max_length=36),
        default=list,
        blank=True,
        help_text="List of OpenHexa pipeline UUIDs available for this planning",
    )
```

**Key Fields**:
- `pipeline_uuids`:  Array of OpenHexa pipeline UUIDs that can be used for this planning. This allows linking specific pipelines to a planning configuration.
```

### Assignment Model

```python
class Assignment(SoftDeletableModel):
    planning = models.ForeignKey("Planning", on_delete=models.CASCADE)
    org_unit = models.ForeignKey("OrgUnit", on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [["planning", "org_unit"]]
```

### OrgUnitType Hierarchy

```python
class OrgUnitType(models.Model):
    name = models.CharField(max_length=255)  # e.g., "Country", "Region", "District", "Health Facility"
    short_name = models.CharField(max_length=255)
    depth = models.PositiveSmallIntegerField(null=True, blank=True)  # Hierarchy level
    sub_unit_types = models.ManyToManyField("OrgUnitType", related_name="super_types", blank=True)
    projects = models.ManyToManyField("Project", related_name="unit_types", blank=False)
    
    CATEGORIES = [
        ("COUNTRY", _("Country")),
        ("REGION", _("Region")),
        ("DISTRICT", _("District")),
        ("HF", _("Health Facility")),
    ]
    category = models.CharField(max_length=8, choices=CATEGORIES, null=True, blank=True)
```

### Team Hierarchy

```python
class Team(SoftDeletableModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    project = models.ForeignKey(Project, on_delete=models.PROTECT)
    users = models.ManyToManyField(User, related_name="teams", blank=True)
    manager = models.ForeignKey(User, on_delete=models.PROTECT, related_name="managed_teams")
    parent = models.ForeignKey("self", on_delete=models.PROTECT, null=True, blank=True, related_name="sub_teams")
    path = PathField(unique=True)  # Hierarchical path
    type = models.CharField(choices=TeamType.choices, max_length=100, null=True, blank=True)
    
class TeamType(models.TextChoices):
    TEAM_OF_TEAMS = "TEAM_OF_TEAMS", "Team of teams"
    TEAM_OF_USERS = "TEAM_OF_USERS", "Team of users"
```

## Pipeline Integration

### Pipeline Parameters

The OpenHexa pipeline receives the following parameters:

```python
@pipeline
def lqas_assignment_pipeline(
    planning_id: int,
    task_id: int,
    org_unit_type_sequence_identifiers: List[int],  # [398, 399, 400] - IDs from higher to lower level
    org_unit_type_quantities: List[int],            # [2, 3, 4] - quantities at each level
    org_unit_type_exceptions: List[str],            # ["12098,108033", "", ""] - exceptions per level
):
    """
    LQAS Assignment Pipeline
    
    Args:
        planning_id: ID of the planning to generate assignments for
        task_id: ID of the task for status updates
        org_unit_type_sequence_identifiers: List of org unit type IDs in hierarchy order (top to bottom)
        org_unit_type_quantities: List of quantities to select at each level
        org_unit_type_exceptions: List of comma-separated org unit IDs to exclude at each level
    """
```

### Parameter Structure

#### org_unit_type_sequence_identifiers
- **Type**: `List[int]`
- **Description**: IDs of org unit types in hierarchical order (from highest to lowest level)
- **Example**: `[398, 399, 400]` where:
  - `398` = Country level
  - `399` = Region level  
  - `400` = District level

#### org_unit_type_quantities
- **Type**: `List[int]`
- **Description**: Number of org units to select at each level
- **Example**: `[2, 3, 4]` means:
  - Select 2 countries
  - From each country, select 3 regions
  - From each region, select 4 districts
  - Total: 2 × 3 × 4 = 24 districts

#### org_unit_type_exceptions
- **Type**: `List[str]`
- **Description**: Org unit IDs to exclude from random sampling at each level. Each string contains comma-separated IDs of org units to ignore during sampling at that specific level.
- **Example**: `["12098,108033", "", ""]` means:
  - Exclude countries with IDs 12098 and 108033 (comma-separated in first string)
  - No region exceptions (empty string)
  - No district exceptions (empty string)

### Pipeline Execution Flow

1. **Validation**: Verify org unit type hierarchy matches team hierarchy
2. **Sampling**: Apply LQAS algorithm to select org units
3. **Assignment**: Assign selected org units to teams/users
4. **Status Updates**: Update task progress throughout execution
5. **Result Storage**: Store final assignments in Iaso database

### Task Status Updates

The pipeline updates task status at key milestones:

```python
def update_task_status(task_id, status, message, progress_value=None, end_value=None, result_data=None):
    """Update task status in Iaso"""
    # Send PATCH request to /api/openhexa/pipelines/{pipeline_id}/
    # with task_id, status, progress_message, progress_value, end_value, result_data
```

**Status Values**:
- `RUNNING`: Pipeline is executing
- `SUCCESS`: Pipeline completed successfully
- `ERRORED`: Pipeline failed with error
- `KILLED`: Pipeline was terminated

## OpenHexa Configuration

### Configuration Parameters

The OpenHexa integration requires configuration stored in the `Config` model with slug `"openhexa-config"`. The configuration includes:

#### Required Parameters
- `openhexa_url`: The GraphQL endpoint URL for OpenHexa
- `openhexa_token`: Authentication token for OpenHexa API
- `workspace_slug`: The workspace identifier in OpenHexa

#### Optional Parameters
- `lqas_pipeline_code`: The pipeline code used to display a custom form for LQAS sampling in the OpenHexa integration UI. This enables specialized LQAS sampling forms when available.
- `connection_name`: Connection used by OpenHexa hook to save data into Iaso default is ('iaso-pipeline')

### Configuration Example

```json
{
    "openhexa_url": "https://openhexa.example.com/graphql/",
    "openhexa_token": "your-api-token-here",
    "workspace_slug": "your-workspace",
    "lqas_pipeline_code": "lqas-sampling-pipeline",
    "connection_name": "iaso-pipeline"
}
```

### Configuration Endpoint

The system provides an endpoint to check OpenHexa configuration status:

```http
GET /api/openhexa/pipelines/config/
```

**Response**:
```json
{
    "configured": true,
    "lqas_pipeline_code": "lqas-sampling-pipeline"
}
```

- `configured`: Boolean indicating if all required parameters are present
- `lqas_pipeline_code`: Only included if present in configuration

## API Endpoints

### Pipeline Management

#### Launch Pipeline
```http
POST /api/openhexa/pipelines/{pipeline_id}/
Content-Type: application/json

{
    "version": "uuid-of-pipeline-version",
    "config": {
        "planning_id": 123,
        "task_id": 456,
        "org_unit_type_sequence_identifiers": [398, 399, 400],
        "org_unit_type_quantities": [2, 3, 4],
        "org_unit_type_exceptions": ["12098,108033", "", ""]
    }
}
```

#### Update Task Status
```http
PATCH /api/openhexa/pipelines/{pipeline_id}/
Content-Type: application/json

{
    "task_id": 456,
    "status": "SUCCESS",
    "progress_message": "Pipeline completed successfully",
    "progress_value": 100,
    "end_value": 100,
    "result_data": {
        "assignments_created": 24,
        "org_units_selected": [...],
        "teams_assigned": [...]
    }
}
```

### Assignment Management

#### Delete All Assignments for Planning
```http
DELETE /api/assignments/?planning={planning_id}
```

#### Bulk Create Assignments
```http
POST /api/assignments/bulk_create_assignments/
Content-Type: application/json

{
    "planning": 123,
    "assignments": [
        {
            "org_unit": 1001,
            "team": 201,
            "user": null
        },
        {
            "org_unit": 1002,
            "team": 202,
            "user": 301
        }
    ]
}
```

## Frontend Integration

### User Workflow

The correct workflow for planning-pipeline integration is:

1. **Planning Creation/Edition**: User selects available pipelines (no parameters)
2. **Assignment Map View**: User views current assignments and launches sampling
3. **Parameter Configuration**: User configures sampling parameters in a dialog
4. **Pipeline Execution**: System executes pipeline and updates assignments

### Planning Configuration UI

The planning creation/edition dialog should include:

1. **Pipeline Selection**: Multi-select dropdown for available pipelines (only pipeline selection, no parameters) - Only visible if OpenHexa config is present
   - Selected pipelines are stored in the `pipeline_uuids` field as an array of UUIDs
   - This links specific pipelines to the planning configuration

### Assignment View UI (Map Page)

The assignment details view (map page) should display:

1. **Current Assignments**: Table showing org units assigned to teams/users
2. **Visual Map**: Geographic representation of assignments
3. **Pipeline Controls**: Buttons to:
   - **Launch Sample**: Open parameter configuration dialog
   - View pipeline status
   - Delete existing assignments (with confirmation)
4. **Parameter Configuration Dialog**: Modal/dialog for:
   - Pipeline selection (if multiple available)
   - Org unit type hierarchy selection
   - Quantities at each level
   - Exception org units (comma-separated IDs to exclude per level)

### Workflow Details

#### Step 1: Planning Creation/Edition
- User creates or edits a planning
- User selects which pipelines are available for this planning

#### Step 2: Assignment Map View
- User navigates to the assignment map view for the planning
- User sees current assignments (if any) on the map and in the table
- User sees "Launch Sample" button (only if OpenHexa is configured)

#### Step 3: Launch Sample
- User clicks "Launch Sample" button
- If existing assignments exist, show confirmation dialog: "This will delete all existing assignments. Continue?"
- Open parameter configuration dialog

#### Step 4: Parameter Configuration
- User selects pipeline (if multiple available)
- User configures sampling parameters:
  - Org unit type hierarchy (from higher to lower level)
  - Quantities at each level
  - Exception org units to exclude (comma-separated IDs per level)
- User clicks "Launch Pipeline" to execute

#### Step 5: Pipeline Execution
- System creates task and launches pipeline
- User sees task status updates
- System updates assignments when pipeline completes
- User sees new assignments on map and in table

## Validation Rules

### Hierarchy Validation

1. **Org Unit Type Hierarchy**: Must match team hierarchy depth
2. **Team Hierarchy**: Must be compatible with org unit type structure
3. **Exception Validation**: Exception org units must exist and be of correct type

### Pipeline Validation

1. **Parameter Validation**: All required parameters must be provided
2. **Type Validation**: Parameter types must match expected formats
3. **Range Validation**: Quantities must be positive integers
4. **Existence Validation**: All referenced IDs must exist in database

## Error Handling

### Common Error Scenarios

1. **Hierarchy Mismatch**: Org unit type hierarchy doesn't match team hierarchy
2. **Invalid Parameters**: Missing or invalid pipeline parameters
3. **Pipeline Failure**: OpenHexa pipeline execution fails
4. **Assignment Conflicts**: Attempting to create duplicate assignments

### Error Response Format

```json
{
    "error": "Error message",
    "details": {
        "field": "specific field error",
        "code": "ERROR_CODE"
    }
}
```
