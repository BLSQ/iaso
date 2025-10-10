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
    connection_host: str,                           # "http://localhost:8081" - Iaso server URL
    connection_token: str,                          # Session token for authentication
):
    """
    LQAS Assignment Pipeline
    
    Args:
        planning_id: ID of the planning to generate assignments for
        task_id: ID of the task for status updates
        org_unit_type_sequence_identifiers: List of org unit type IDs in hierarchy order (top to bottom)
        org_unit_type_quantities: List of quantities to select at each level
        org_unit_type_exceptions: List of comma-separated org unit IDs to exclude at each level
        connection_host: Host URL of the Iaso server (e.g., "http://localhost:8081")
        connection_token: Session token for authentication
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

#### connection_host
- **Type**: `str`
- **Description**: Host URL of the Iaso server to connect to. This enables multitenant support by allowing pipelines to connect to different Iaso instances. This URL is automatically generated during pipeline launch based on the current request.
- **Example**: `"http://localhost:8081"` or `"https://iaso.example.com"`
- **Note**: This parameter is automatically added to the config by the backend during pipeline launch - it should not be provided by the frontend.

#### connection_token
- **Type**: `str`
- **Description**: JWT Bearer token for authentication with the Iaso API. This token is automatically generated during pipeline launch using the authenticated user's credentials and used in the `Authorization: Bearer {token}` header.
- **Example**: `"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."` (JWT access token)
- **Note**: This parameter is automatically added to the config by the backend during pipeline launch - it should not be provided by the frontend.

### Pipeline Execution Flow

#### Iaso Side (Backend)
1. **Task Creation**: Create background task using `beanstalk_worker` decorator
2. **Pipeline Launch**: Launch OpenHEXA pipeline via GraphQL API
3. **Continuous Polling**: Start background polling loop to monitor pipeline status
4. **Status Synchronization**: Update Iaso task status to match OpenHEXA pipeline status
5. **Result Handling**: Process pipeline results when completed

#### OpenHEXA Side (Pipeline)
1. **Connection Test**: Validate connection to Iaso API using provided host and token
2. **Validation**: Verify org unit type hierarchy matches team hierarchy
3. **Sampling**: Apply LQAS algorithm to select org units
4. **Assignment**: Assign selected org units to teams/users
5. **Progress Updates**: Optionally update task progress throughout execution
6. **Result Storage**: Store final assignments in Iaso database

#### Status Management
- **Automatic**: Iaso polling system handles all status transitions
- **Real-time**: Status updates happen automatically as OpenHEXA pipeline progresses
- **Reliable**: Configurable timeout protection - prevents ghost tasks while allowing sufficient execution time
- **Aligned**: Iaso task status always matches OpenHEXA pipeline status

### API Authentication

The pipeline uses JWT Bearer token authentication instead of OpenHexa's connection system. This approach provides better multitenant support, security, and direct control over API calls.

#### Generic API Caller

```python
def call_api(
    base_url: str,
    endpoint: str,
    bearer_token: str,
    method: str = "GET",
    data: Optional[Dict] = None,
    params: Optional[Dict] = None,
) -> Any:
    """
    Generic API caller that uses Bearer token authentication.

    Args:
        base_url (str): Root server URL, e.g. "http://localhost:8081"
        endpoint (str): API endpoint, e.g. "/api/forms/" (no trailing slash required)
        bearer_token (str): JWT Bearer token for authentication
        method (str): HTTP method, default "GET" (can be "POST", "PUT", "PATCH", "DELETE")
        data (dict, optional): Data payload for POST/PUT/PATCH
        params (dict, optional): Query params for GET requests

    Returns:
        dict or str: JSON response if possible, otherwise raw text
    """
```

#### Token Acquisition

JWT tokens for pipeline authentication are automatically generated by the backend during pipeline launch:

```python
# Backend automatically generates JWT token during pipeline launch
config["connection_token"] = get_user_token(request.user)
config["connection_host"] = f"{scheme}://{host}"
```

The backend uses the authenticated user's credentials to generate a JWT access token that can be used as a Bearer token for API authentication. This approach ensures that:

- The token is always valid and properly scoped to the authenticated user
- No additional API calls are needed from the frontend
- Token generation is handled securely on the server side
- The token is automatically included in the pipeline configuration

#### Connection Testing

The pipeline includes a connection test function that validates API connectivity before proceeding:

```python
def test_connection(connection_host: str, connection_token: str) -> bool:
    """
    Test the connection to Iaso API.
    
    Args:
        connection_host: Host URL of the Iaso server
        connection_token: JWT Bearer token for authentication
        
    Returns:
        bool: True if connection is successful, False otherwise
    """
```

**Benefits of this approach:**
- **Automatic Token Generation**: JWT tokens are generated server-side during pipeline launch
- **Multitenant Support**: Each pipeline run can connect to different Iaso instances
- **Standard Authentication**: Uses industry-standard JWT Bearer token authentication
- **Better Performance**: No dependency on OpenHexa's connection management
- **Error Handling**: Proper connection testing and error reporting
- **Security**: JWT tokens are time-limited and secure, generated with user's credentials
- **Clean Implementation**: No cookie access issues or HttpOnly problems
- **Compatibility**: Works seamlessly with existing Django JWT setup
- **Simplified Frontend**: Frontend doesn't need to handle token acquisition

### Task Status Updates

The pipeline integration uses a dual approach for task status management:

#### 1. Pipeline Progress Updates (Optional)

The pipeline can optionally update progress and messages using the generic API caller:

```python
def safe_update_task_status(
    task_id: Optional[int],
    message: str,
    connection_host: str,
    connection_token: str,
    pipeline_id: str,
    progress_value: Optional[int] = None,
    end_value: Optional[int] = None,
    result_data: Optional[Dict] = None,
    status: Optional[str] = None,  # Optional - not used by default
):
    """Safely update task progress and messages in Iaso."""
    # Uses call_api() function to send PATCH request to /api/openhexa/pipelines/{pipeline_id}/
    # with task_id, progress_message, progress_value, end_value, result_data
    # Status updates are handled by the polling system, not the pipeline
```

#### 2. Automatic Status Polling System

The main status management is handled by Iaso's background task system that continuously polls OpenHEXA for pipeline status:

```python
@task_decorator(task_name="launch_openhexa_pipeline")
def launch_openhexa_pipeline(
    pipeline_id: str,
    openhexa_url: str,
    openhexa_token: str,
    version: str,
    config: dict,
    delay: int = 2,
    max_polling_duration_minutes: int = 10,
    task: Task = None,
):
    """
    Background task that:
    1. Launches the OpenHEXA pipeline
    2. Continuously polls OpenHEXA for status updates
    3. Updates Iaso task status to match OpenHEXA pipeline status
    4. Handles all status transitions automatically
    5. Times out after max_polling_duration_minutes to prevent ghost tasks
    """
```

**Key Features**:
- **Continuous Polling**: Polls OpenHEXA until pipeline reaches final state or timeout
- **Configurable Timeout**: Default 10-minute timeout prevents ghost tasks (configurable via `max_polling_duration_minutes`)
- **Status Alignment**: Iaso task status always matches OpenHEXA pipeline status
- **Automatic Transitions**: Handles all status changes automatically
- **Error Handling**: Proper error handling and logging
- **Timeout Protection**: Prevents indefinite polling that could create ghost tasks

**Timeout Implementation**:
```python
# Check if polling timeout has been reached
current_time = datetime.now()
elapsed_time = current_time - polling_start_time
if elapsed_time > max_polling_duration:
    timeout_message = (
        f"Polling timeout reached after {max_polling_duration_minutes} minutes for pipeline {pipeline_id}"
    )
    logger.warning(timeout_message)
    task.report_failure(Exception(timeout_message))
    return
```

**Status Values**:
- `QUEUED`: Pipeline is queued for execution
- `RUNNING`: Pipeline is executing
- `SUCCESS`: Pipeline completed successfully
- `ERRORED`: Pipeline failed with error
- `EXPORTED`: Pipeline results have been exported
- `SKIPPED`: Pipeline execution was skipped
- `KILLED`: Pipeline was terminated

**OpenHEXA Status Mapping**:
- `success`, `completed`, `done` → `SUCCESS`
- `failed`, `errored`, `cancelled`, `error` → `ERRORED`
- `running`, `queued`, `pending`, `started` → `RUNNING`

### Background Task System

The integration uses Iaso's `beanstalk_worker` system for reliable background task execution:

#### Task Creation and Management
```python
# Task is automatically created by the decorator
@task_decorator(task_name="launch_openhexa_pipeline")
def launch_openhexa_pipeline(user, pipeline_id, openhexa_url, openhexa_token, version, config, delay=2, task=None):
    """
    Single task handles both pipeline launch and continuous monitoring
    """
    # 1. Set task properties
    task.external = True
    task.status = QUEUED
    
    # 2. Launch OpenHEXA pipeline
    ExternalTaskModelViewSet.launch_task(...)
    
    # 3. Start continuous polling loop
    while True:
        # Poll OpenHEXA for status
        # Update Iaso task status accordingly
        # Handle final states (SUCCESS/ERRORED)
```

#### Key Benefits
- **Single Task**: One task handles both launch and monitoring (no separate polling tasks)
- **User Association**: Task is automatically associated with the launching user
- **Reliable Execution**: Uses Iaso's proven background task system
- **Status Consistency**: Task status always reflects OpenHEXA pipeline status
- **Error Handling**: Proper error handling and logging throughout
- **Kill Support**: Respects task kill signals for graceful termination

#### Polling Behavior
- **Continuous**: Polls until pipeline reaches final state or timeout
- **Efficient**: Only logs status changes, not every poll attempt
- **Configurable**: Polling delay can be adjusted (default: 2 seconds)
- **Timeout Protection**: Default 10-minute timeout prevents ghost tasks
- **Robust**: Handles network errors and continues polling
- **Aligned**: Iaso task status always matches OpenHEXA pipeline status

## OpenHexa Configuration

### Configuration Parameters

The OpenHexa integration requires configuration stored in the `Config` model with slug `"openhexa-config"`. The configuration includes:

#### Required Parameters
- `openhexa_url`: The GraphQL endpoint URL for OpenHexa
- `openhexa_token`: Authentication token for OpenHexa API
- `workspace_slug`: The workspace identifier in OpenHexa

#### Optional Parameters
- `lqas_pipeline_code`: The pipeline code used to display a custom form for LQAS sampling in the OpenHexa integration UI. This enables specialized LQAS sampling forms when available.

### Configuration Example

```json
{
    "openhexa_url": "https://openhexa.example.com/graphql/",
    "openhexa_token": "your-api-token-here",
    "workspace_slug": "your-workspace",
    "lqas_pipeline_code": "lqas-sampling-pipeline",
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
POST /api/openhexa/pipelines/{pipeline_id}/launch/
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

**Note**: The `connection_host` and `connection_token` parameters are automatically added to the config by the backend during pipeline launch. The frontend should not include these parameters in the request.

#### Update Task Status (Pipeline → Iaso)
```http
PATCH /api/openhexa/pipelines/{pipeline_id}/
Content-Type: application/json

{
    "task_id": 456,
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

**Note**: The `status` parameter is optional and not used by default. Status updates are handled automatically by Iaso's polling system. The pipeline should only send progress updates and messages.

#### Automatic Status Updates (Iaso → OpenHEXA)
Status updates are handled automatically by the background polling system:

- **QUEUED**: When pipeline is launched
- **RUNNING**: When OpenHEXA pipeline starts executing
- **SUCCESS**: When OpenHEXA pipeline completes successfully
- **ERRORED**: When OpenHEXA pipeline fails
- **KILLED**: When task is manually terminated

The polling system continuously monitors OpenHEXA and updates Iaso task status accordingly.

## Architecture Improvements

### Key Benefits of the New Architecture

#### 1. **Reliable Status Management**
- **Automatic Synchronization**: Iaso task status always matches OpenHEXA pipeline status
- **No Manual Updates**: Status changes are handled automatically by the polling system
- **Real-time Updates**: Status changes are reflected immediately in the UI
- **Consistent State**: Eliminates status mismatches between systems

#### 2. **Robust Pipeline Execution**
- **Configurable Timeouts**: Default 10-minute timeout prevents ghost tasks (configurable)
- **Continuous Monitoring**: Polls until pipeline reaches final state or timeout
- **Error Recovery**: Handles network errors and continues polling
- **Kill Support**: Respects task termination signals
- **Timeout Protection**: Prevents indefinite polling that could create ghost tasks

#### 3. **Simplified Pipeline Development**
- **Optional Status Updates**: Pipelines can focus on business logic, not status management
- **Progress Reporting**: Pipelines can still send progress updates and messages
- **Clean Separation**: Status management is handled by Iaso, not the pipeline
- **Reduced Complexity**: Pipelines don't need to handle status transitions

#### 4. **Better User Experience**
- **Accurate Status**: Users always see the correct pipeline status
- **Real-time Feedback**: Status updates happen automatically
- **Reliable Monitoring**: No more stuck or orphaned tasks
- **Consistent Interface**: Same task management interface for all pipeline types

#### 5. **Improved Maintainability**
- **Single Source of Truth**: OpenHEXA is the authoritative source for pipeline status
- **Centralized Logic**: All status management logic is in one place
- **Easier Debugging**: Clear separation between pipeline logic and status management
- **Better Testing**: Status management can be tested independently

### Migration from Previous Architecture

The new architecture is backward compatible with existing pipelines:

- **Existing Pipelines**: Continue to work without modification
- **Status Updates**: Optional - pipelines can still send status updates if needed
- **Progress Updates**: Still supported and recommended for user feedback
- **Error Handling**: Improved error handling and recovery

### Best Practices

#### For Pipeline Developers
1. **Focus on Business Logic**: Don't worry about status management
2. **Send Progress Updates**: Use `safe_update_task_status()` for user feedback
3. **Handle Errors Gracefully**: Let the polling system handle status updates
4. **Use Result Data**: Include meaningful data in progress updates

#### For Frontend Developers
1. **Monitor Task Status**: Use the task status for UI updates
2. **Show Progress**: Display progress messages from the pipeline
3. **Handle States**: Implement proper UI states for each task status
4. **Real-time Updates**: Use task polling for real-time status updates

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
