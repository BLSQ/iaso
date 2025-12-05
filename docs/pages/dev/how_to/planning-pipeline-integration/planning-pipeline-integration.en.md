# Planning-Pipeline Integration Documentation

## Overview

This document describes the integration between Iaso's Planning feature and OpenHexa pipelines for LQAS (Lot Quality Assurance Sampling) sampling. The integration allows users to configure sampling parameters and automatically generate **org unit groups** using LQAS algorithms. 

**Important**: The pipeline is responsible **only for sampling** and creating org unit groups. Assignment of org units to teams/users is handled separately on the Iaso side.

## Architecture Overview

### Core Components

1. **Planning System**: Manages planning configurations and sampling results
2. **OpenHexa Integration**: Handles pipeline execution and task management via `OpenHEXAInstance` and `OpenHEXAWorkspace` model
3. **Sampling Engine**: OpenHexa pipeline that selects org units using LQAS algorithm
4. **Group Creation**: Pipeline creates org unit groups in Iaso
5. **Assignment Engine**: Iaso-side system that assigns groups to teams/users (separate from pipeline)
6. **UI Components**: Frontend interfaces for configuration and monitoring

### Data Flow

```
Planning Configuration → Pipeline Parameters → OpenHexa Execution → LQAS Sampling → Group Creation → Task Result Storage → UI Display
```

**Note**: Assignment of org units to teams/users happens on the Iaso side after the pipeline completes.

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

**Note**: Assignments are created on the Iaso side, not by the OpenHexa pipeline. The pipeline only creates org unit groups.

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

### Sampling Results Model (Planned)

A new model is planned to track multiple sampling runs per planning:

```python
class PlanningSamplingResult(models.Model):
    """Stores the results of sampling pipeline runs."""
    planning = models.ForeignKey("Planning", on_delete=models.CASCADE, related_name="sampling_results")
    task = models.ForeignKey("Task", on_delete=models.SET_NULL, null=True, blank=True)
    pipeline_id = models.CharField(max_length=36)  # OpenHexa pipeline UUID
    pipeline_version = models.CharField(max_length=100)  # Pipeline version
    group = models.ForeignKey("Group", on_delete=models.SET_NULL, null=True, blank=True)  # Created org unit group
    org_units_count = models.IntegerField()  # Number of sampled org units
    parameters = models.JSONField()  # Sampling parameters used
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
```

**Purpose**: This model will allow:
- Storing multiple sampling runs for comparison
- Tracking which pipeline and version was used
- Linking to the created org unit group
- Enabling users to compare different sampling results
- Allowing selection of the best sampling result for assignment creation

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
    pipeline_id: str,                               # Pipeline UUID for status updates
    org_unit_type_sequence_identifiers: List[int],  # [398, 399, 400] - IDs from higher to lower level
    org_unit_type_quantities: List[int],            # [2, 3, 4] - quantities at each level
    org_unit_type_exceptions: List[str],            # ["12098,108033", "", ""] - exceptions per level
    org_unit_type_criteria: List[str],              # ["RURAL/URBAN", "RURAL", "URBAN"] - criteria per level
    connection_host: str,                           # "http://localhost:8081" - Iaso server URL
    connection_token: str,                          # JWT Bearer token for authentication
):
    """
    LQAS Org Unit Selection Pipeline
    
    This pipeline samples org units using LQAS algorithm and creates an org unit group.
    The group can then be used on the Iaso side to create assignments to teams/users.
    
    Args:
        planning_id: ID of the planning to generate sampling for
        task_id: ID of the task for progress and status updates
        pipeline_id: UUID of the pipeline for API status update endpoint
        org_unit_type_sequence_identifiers: List of org unit type IDs in hierarchy order (top to bottom)
        org_unit_type_quantities: List of quantities to select at each level
        org_unit_type_exceptions: List of comma-separated org unit IDs to exclude at each level
        org_unit_type_criteria: List of criteria for selection at each level (RURAL/URBAN, RURAL, or URBAN)
        connection_host: Host URL of the Iaso server (e.g., "http://localhost:8081")
        connection_token: JWT Bearer token for authentication
    """
```

### Parameter Structure

#### planning_id
- **Type**: `int`
- **Description**: ID of the planning for which org units should be sampled
- **Required**: Yes
- **Example**: `123`

#### task_id
- **Type**: `int`
- **Description**: ID of the background task for progress and status updates
- **Required**: Yes (can be None in some cases)
- **Example**: `456`

#### pipeline_id
- **Type**: `str`
- **Description**: UUID of the OpenHexa pipeline, used to construct the API endpoint for task status updates (`/api/openhexa/pipelines/{pipeline_id}/`)
- **Required**: Yes
- **Example**: `"f2bbb20d-0170-4b73-af08-e24390859571"`

#### org_unit_type_sequence_identifiers
- **Type**: `List[int]`
- **Description**: IDs of org unit types in hierarchical order (from highest to lowest level). Defines the hierarchy levels to sample from.
- **Example**: `[398, 399, 400]` where:
  - `398` = Country level
  - `399` = Region level  
  - `400` = District level

#### org_unit_type_quantities
- **Type**: `List[int]`
- **Description**: Number of org units to randomly select at each hierarchy level using LQAS sampling
- **Example**: `[2, 3, 4]` means:
  - Select 2 org units at country level
  - From each selected country, select 3 org units at region level
  - From each selected region, select 4 org units at district level
  - Total sampled: 2 × 3 × 4 = 24 org units at the lowest level

#### org_unit_type_exceptions
- **Type**: `List[str]`
- **Description**: Org unit IDs to exclude from random sampling at each hierarchy level. Each string contains comma-separated IDs of org units to exclude during LQAS sampling at that specific level.
- **Example**: `["12098,108033", "", ""]` means:
  - At country level: exclude org units with IDs 12098 and 108033 from sampling pool
  - At region level: no exclusions (empty string)
  - At district level: no exclusions (empty string)
- **Note**: Empty strings indicate no exclusions at that level

#### org_unit_type_criteria
- **Type**: `List[str]`
- **Description**: Selection criteria for org units at each hierarchy level. Controls whether to include rural, urban, or both types of org units in the sampling pool.
- **Choices**: `"RURAL/URBAN"`, `"RURAL"`, `"URBAN"`
- **Example**: `["RURAL/URBAN", "RURAL", "URBAN"]` means:
  - At first level: include both rural and urban org units in sampling pool
  - At second level: include only rural org units in sampling pool
  - At third level: include only urban org units in sampling pool
- **Note**: This filters the available org units before applying LQAS random sampling

#### connection_host
- **Type**: `str`
- **Description**: Base URL of the Iaso server. This enables multitenant support by allowing pipelines to connect to different Iaso instances. This URL is automatically generated during pipeline launch based on the current HTTP request.
- **Example**: `"https://iaso.example.com"` or `"http://localhost:8081"`
- **Note**: This parameter is **automatically added** to the config by the backend during pipeline launch - the frontend should **not** provide this parameter.

#### connection_token
- **Type**: `str`
- **Security**: ⚠️ **This parameter should be protected/hidden in the OpenHexa UI** - it contains sensitive authentication credentials and should not be visible to end users
- **Description**: JWT Bearer token for authentication with the Iaso API. This token is automatically generated during pipeline launch using the authenticated user's credentials and is used in the `Authorization: Bearer {token}` header for all API calls from the pipeline.
- **Example**: `"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."` (JWT access token)
- **Note**: This parameter is **automatically added** to the config by the backend during pipeline launch - the frontend should **not** provide this parameter.

### Pipeline Execution Flow

#### Iaso Side (Backend)
1. **Task Creation**: Create background task using `beanstalk_worker` decorator
2. **Pipeline Launch**: Launch OpenHEXA pipeline via GraphQL API
3. **Continuous Polling**: Start background polling loop to monitor pipeline status
4. **Status Synchronization**: Update Iaso task status to match OpenHEXA pipeline status
5. **Result Handling**: Process pipeline results when completed

#### OpenHEXA Side (Pipeline)
1. **Connection Test**: Validate connection to Iaso API using provided host and token
2. **Validation**: Verify parameters and org unit type hierarchy
3. **Data Fetch**: Retrieve planning info and org units from Iaso
4. **Sampling**: Apply LQAS algorithm to select org units based on quantities, criteria, and exceptions
5. **Group Creation**: Create org unit group in Iaso containing sampled units
6. **Progress Updates**: Update task progress throughout execution
7. **Result Storage**: Store sampling results (task_id, group_id, planning_id, org_unit_ids) to database
8. **Task Update**: Save final results to task (group_id, org_units_count, etc.)

**Note**: The pipeline does NOT create assignments. Assignment creation is handled on the Iaso side.

#### Status Management
- **Automatic**: Iaso polling system handles all status transitions
- **Real-time**: Status updates happen automatically as OpenHEXA pipeline progresses
- **Reliable**: Configurable timeout protection - prevents ghost tasks while allowing sufficient execution time
- **Aligned**: Iaso task status always matches OpenHEXA pipeline status

### API Authentication

The pipeline uses JWT Bearer token authentication instead of OpenHexa's connection system. This approach provides better multitenant support, security, and direct control over API calls.

#### Generic API Caller

The pipeline uses a generic API caller function for all Iaso API interactions:

```python
def call_api(
    base_url: str,
    endpoint: str,
    bearer_token: str,
    method: str = "GET",
    data: Optional[Dict] = None,
    params: Optional[Dict] = None,
    timeout: int = 300,
) -> Any:
    """
    Generic API caller that uses Bearer token authentication.

    Args:
        base_url (str): Root server URL, e.g. "http://localhost:8081"
        endpoint (str): API endpoint, e.g. "/api/forms/" (no trailing slash required)
        bearer_token (str): Bearer token for authentication
        method (str): HTTP method, default "GET" (can be "POST", "PUT", "PATCH", "DELETE")
        data (dict, optional): Data payload for POST/PUT/PATCH
        params (dict, optional): Query params for GET requests
        timeout (int): Request timeout in seconds (default: 300s / 5 minutes)
                      Increase for large data fetches like org unit hierarchies

    Returns:
        dict or str: JSON response if possible, otherwise raw text
    """
```

**Key Features:**
- Bearer token authentication
- Configurable timeout (default 5 minutes for large hierarchies)
- Automatic JSON parsing
- HTTP error handling with `raise_for_status()`

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

#### 1. Pipeline Progress Updates (Recommended)

The pipeline uses a `TaskProgressLogger` class for convenient progress tracking:

```python
class TaskProgressLogger:
    """Logger for task progress with Iaso integration.
    
    Encapsulates task context to avoid repetitive parameter passing.
    Implements smart batching to reduce API calls.
    """

    def __init__(
        self,
        task_id: Optional[int],
        pipeline_id: str,
        connection_host: str,
        connection_token: str,
        batch_threshold: int = 5,
    ):
        """Initialize the logger with task context.
        
        Args:
            task_id: ID of the task (can be None)
            pipeline_id: Pipeline ID for the endpoint
            connection_host: Iaso server URL
            connection_token: Bearer token for authentication
            batch_threshold: Minimum progress change to trigger API call (default: 5%)
        """

    def log(
        self,
        message: str,
        progress_value: Optional[int] = None,
        result_data: Optional[Dict] = None,
        log_level: str = "info",
        force_send: bool = False,
    ):
        """Log progress with current task context.
        
        Args:
            message: Progress message
            progress_value: Optional progress value (end_value is always 100)
            result_data: Optional result data to save (usually for final step)
            log_level: Level of the log (info, error, warning, debug)
            force_send: Force immediate API call (bypasses batching)
        """

    def flush(self):
        """Force send any pending updates (call at end of pipeline)."""
```

**Usage Example:**
```python
# Initialize logger once at pipeline start
logger = TaskProgressLogger(
    task_id=task_id,
    pipeline_id=pipeline_id,
    connection_host=connection_host,
    connection_token=connection_token,
)

# Use throughout pipeline
logger.log("Starting data fetch", 10)
logger.log("Data fetched successfully", 50)
logger.log("Processing complete", 100, result_data={"count": 42})
```

**Smart Batching Features:**
- Batches updates by default (only sends when progress changes by 5% or more)
- Always sends errors and warnings immediately
- Always sends final update (100% or with result_data)
- Can force immediate send with `force_send=True`
- Auto-raises RuntimeError on error log level (fails pipeline properly)

#### 2. Direct API Updates (Low-Level)

For direct control, use the `update_task_on_iaso()` function:

```python
def update_task_on_iaso(
    connection_host: str,
    connection_token: str,
    task_id: int,
    pipeline_id: str,
    message: str,
    progress_value: Optional[int] = None,
    end_value: Optional[int] = None,
    result_data: Optional[Dict] = None,
):
    """
    Update task progress on Iaso (does NOT update status).
    
    Args:
        connection_host: Iaso server URL
        connection_token: Bearer token for authentication
        task_id: Task ID to update
        pipeline_id: Pipeline ID for the endpoint
        message: Progress message
        progress_value: Optional progress value
        end_value: Optional end value
        result_data: Optional result data to save
    """
    # Sends PATCH request to /api/openhexa/pipelines/{pipeline_id}/
    # with task_id, progress_message, progress_value, end_value, result
```

**Note:** Status updates (QUEUED, RUNNING, SUCCESS, ERRORED) are handled automatically by Iaso's polling system. The pipeline should only send progress updates and messages.

#### 3. Automatic Status Polling System

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
    max_polling_duration_minutes: int = 200,
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

### Configuration via OpenHEXAInstance Model

The OpenHexa integration is now configured using the `OpenHEXAInstance` model instead of the legacy `Config` model. This provides better multitenant support and instance management.

For detailed information on OpenHexa configuration, see the [OpenHexa Integration Guide](../openhexa-integration.md).

#### Key Configuration Fields
- `url`: The GraphQL endpoint URL for OpenHexa
- `token`: Authentication token for OpenHexa API
- Workspace information is managed through OpenHexa workspace connections

### LQAS Pipeline Configuration

The Planning feature can be configured to use specific LQAS pipelines:

#### Planning Model Configuration
```python
class Planning(SoftDeletableModel):
    # ... other fields ...
    pipeline_uuids = ArrayField(
        models.CharField(max_length=36),
        default=list,
        blank=True,
        help_text="List of OpenHexa pipeline UUIDs available for this planning",
    )
```

This allows linking specific LQAS sampling pipelines to a planning configuration.

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
        "pipeline_id": "f2bbb20d-0170-4b73-af08-e24390859571",
        "org_unit_type_sequence_identifiers": [398, 399, 400],
        "org_unit_type_quantities": [2, 3, 4],
        "org_unit_type_exceptions": ["12098,108033", "", ""],
        "org_unit_type_criteria": ["RURAL/URBAN", "RURAL", "URBAN"]
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
        "pipeline_name": "LQAS Org Unit Selection Pipeline",
        "status": "SUCCESS",
        "group_id": 789,
        "planning_id": 123,
        "org_units_ids": [1001, 1002, 1003],
        "org_units_count": 3,
        "execution_time": "2025-12-05T10:30:00"
    }
}
```

**Note**: The `status` parameter is optional and not used by default. Status updates are handled automatically by Iaso's polling system. The pipeline should only send progress updates and messages with result data.

#### Automatic Status Updates (Iaso → OpenHEXA)
Status updates are handled automatically by the background polling system:

- **QUEUED**: When pipeline is launched
- **RUNNING**: When OpenHEXA pipeline starts executing
- **SUCCESS**: When OpenHEXA pipeline completes successfully
- **ERRORED**: When OpenHEXA pipeline fails
- **KILLED**: When task is manually terminated

The polling system continuously monitors OpenHEXA and updates Iaso task status accordingly.

### Group Management

#### Create Org Unit Group (Pipeline → Iaso)
The pipeline creates org unit groups via the Iaso API:

```http
POST /api/groups/
Content-Type: application/json
Authorization: Bearer {connection_token}

{
    "name": "LQAS Group for Planning 123 - 2025-12-05 10:30",
    "org_unit_ids": [1001, 1002, 1003, ...]
}
```

**Response**:
```json
{
    "id": 789,
    "name": "LQAS Group for Planning 123 - 2025-12-05 10:30",
    "org_unit_ids": [1001, 1002, 1003, ...]
}
```

### Sampling Results Storage

The pipeline stores sampling results in a database table for later retrieval:

```sql
CREATE TABLE assignments_plannings (
    task_id INTEGER,
    group_id INTEGER,
    planning_id INTEGER,
    org_units_ids TEXT  -- JSON string of org unit IDs
);
```

**Future Enhancement**: This will be replaced by a proper Django model (`PlanningSamplingResult`) to enable:
- Multiple sampling runs per planning
- Comparison of different sampling results  
- Selection of preferred sampling for assignment creation

## Future Enhancements

### Sampling Results Model Implementation

**Status**: Planned

**Goal**: Replace the temporary database table with a proper Django model to track multiple sampling runs per planning.

#### Proposed Model

```python
class PlanningSamplingResult(models.Model):
    """Stores the results of LQAS sampling pipeline runs."""
    planning = models.ForeignKey(
        "Planning", 
        on_delete=models.CASCADE, 
        related_name="sampling_results"
    )
    task = models.ForeignKey(
        "Task", 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="sampling_results"
    )
    pipeline_id = models.CharField(max_length=36, help_text="OpenHexa pipeline UUID")
    pipeline_version = models.CharField(max_length=100, help_text="Pipeline version identifier")
    group = models.ForeignKey(
        "Group", 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Created org unit group containing sampled units"
    )
    org_units_count = models.IntegerField(help_text="Number of sampled org units")
    parameters = models.JSONField(help_text="Sampling parameters used for this run")
    status = models.CharField(
        max_length=20,
        choices=[
            ("SUCCESS", "Success"),
            ("FAILED", "Failed"),
            ("RUNNING", "Running"),
        ],
        default="RUNNING"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Sampling Result"
        verbose_name_plural = "Sampling Results"
```

#### Benefits

1. **Multiple Samplings**: Store and compare multiple sampling runs per planning
2. **Audit Trail**: Track who created each sampling and when
3. **Parameter History**: Record exact parameters used for each sampling
4. **Status Tracking**: Monitor sampling execution status
5. **Group Association**: Direct link to created org unit groups
6. **Comparison Interface**: Enable side-by-side comparison in UI

#### UI Features

1. **Sampling Results List**:
   - Display all sampling runs for a planning
   - Show execution timestamp, status, parameters
   - Link to view org unit group contents
   - Action buttons (use for assignments, delete)

2. **Comparison View**:
   - Select multiple sampling results to compare
   - Side-by-side parameter comparison
   - Visual diff of sampled org units
   - Highlight differences in selection

3. **Assignment Creation**:
   - Select preferred sampling result
   - Create assignments based on selected group
   - Track which sampling was used for assignments


