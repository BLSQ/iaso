# OpenHexa Integration with Iaso

This guide covers the complete integration between Iaso and OpenHexa, including pipeline creation, parameter handling, task management, and local development setup.

## Table of Contents

1. [Overview](#overview)
2. [Configuration Setup](#configuration-setup)
3. [OpenHexa Pipeline Parameters](#openhexa-pipeline-parameters)
4. [Creating OpenHexa Pipelines](#creating-openhexa-pipelines)
5. [Pipeline Development](#pipeline-development)
6. [Task Management](#task-management)
7. [Development Utilities](#development-utilities)
8. [API Integration](#api-integration)
9. [Frontend Integration](#frontend-integration)
10. [Troubleshooting](#troubleshooting)

## Overview

OpenHexa is a data pipeline platform that integrates with Iaso to execute data processing tasks. The integration allows:

- **Pipeline Management**: Create, configure, and run data pipelines
- **Parameter Handling**: Dynamic parameter configuration through the Iaso UI
- **Task Tracking**: Monitor pipeline execution status and results
- **Result Storage**: Store pipeline outputs in Iaso's task system

## Configuration Setup

### 1. OpenHexa Configuration in Iaso

OpenHexa configuration is stored in Iaso using two models:

#### OpenHEXAInstance Model

Stores the OpenHexa server connection details:

```python
from iaso.models.openhexa import OpenHEXAInstance

instance = OpenHEXAInstance.objects.create(
    name="Production OpenHEXA",
    url="https://your-openhexa-instance.com/graphql/",
    token="your-openhexa-api-token"
)
```

**Fields**:
- `name`: Descriptive name for the OpenHexa instance
- `url`: GraphQL API endpoint (must contain 'graphql')
- `token`: API authentication token

#### OpenHEXAWorkspace Model

Links an Iaso account to an OpenHexa workspace:

```python
from iaso.models.openhexa import OpenHEXAWorkspace

workspace = OpenHEXAWorkspace.objects.create(
    openhexa_instance=instance,
    account=your_account,
    slug="your-workspace-slug",
    config={
        "lqas_pipeline_code": "optional-pipeline-code"  # Optional configuration
    }
)
```

**Fields**:
- `openhexa_instance`: Foreign key to OpenHEXAInstance
- `account`: Foreign key to the Iaso Account
- `slug`: Workspace slug in OpenHexa
- `config`: Optional JSON field for workspace-specific configuration


### 2. OpenHexa Workspace Setup

1. **Add Workspace to OpenHexa**:
   ```bash
   openhexa workspaces add https://your-openhexa-instance.com your-workspace-slug
   ```

2. **Verify Connection**:
   ```bash
   openhexa workspaces list
   ```

## OpenHexa Pipeline Parameters

OpenHexa supports the following parameter types:

### Supported Parameter Types

| Type | Description | Example |
|------|-------------|---------|
| `str` | String values | `"Hello World"` |
| `bool` | Boolean values | `true`, `false` |
| `int` | Integer values | `42` |
| `float` | Floating-point values | `3.14` |
| `list` | Array of values | `["item1", "item2"]` |
| `dict` | Key-value pairs | `{"key": "value"}` |

### Parameter Properties

Each parameter can have the following properties:

- **`type`**: The parameter type (required)
- **`name`**: Human-readable name (required)
- **`code`**: Unique identifier (required)
- **`default`**: Default value (optional)
- **`required`**: Whether the parameter is required (optional)
- **`choices`**: Available options for select parameters (optional)
- **`multiple`**: Whether multiple values are allowed (optional)

### Parameter Definition Example

```python
from openhexa.sdk import pipeline, parameter

@pipeline(name="My Pipeline")
@parameter("country", type=str, name="Country", default="Burkina Faso", required=True)
@parameter("demo_data", type=bool, name="Use Demo Data", default=True)
@parameter("max_records", type=int, name="Maximum Records", default=1000)
@parameter("confidence", type=float, name="Confidence Threshold", default=0.85)
@parameter("user_preferences", type=dict, name="User Preferences", default={})
def my_pipeline(country, demo_data, max_records, confidence, user_preferences):
    # Pipeline implementation
    pass
```

## Creating OpenHexa Pipelines

### 1. Initialize Pipeline Project

```bash
# Create new pipeline directory
mkdir my-pipeline
cd my-pipeline

# Initialize with template
openhexa pipelines init --template example
```

### 2. Pipeline Structure

```
my-pipeline/
├── pipeline.py          # Main pipeline file
├── requirements.txt     # Python dependencies
└── README.md           # Pipeline documentation
```

### 3. Basic Pipeline Template

```python
from openhexa.sdk import pipeline, parameter, current_run
from logging import getLogger

logger = getLogger(__name__)

@pipeline(name="My Iaso Pipeline")
@parameter("task_id", type=str, name="Task ID", required=True)
@parameter("pipeline_id", type=str, name="Pipeline ID", required=True)
@parameter("country", type=str, name="Country", default="Burkina Faso")
@parameter("demo_data", type=bool, name="Use Demo Data", default=True)
@parameter("max_records", type=int, name="Maximum Records", default=1000)
@parameter("confidence", type=float, name="Confidence Threshold", default=0.85)
def my_pipeline(task_id, pipeline_id, country, demo_data, max_records, confidence):
    """
    Example pipeline that processes data and updates Iaso task status.
    """
    current_run.log_info(f"=== My Iaso Pipeline Started ===")
    current_run.log_info(f"Country: {country}")
    current_run.log_info(f"Demo data: {demo_data}")
    current_run.log_info(f"Max records: {max_records}")
    current_run.log_info(f"Confidence threshold: {confidence}")
    
    # Update task status
    update_task_status(task_id, pipeline_id, "RUNNING", "Processing data...", 25)
    
    try:
        # Your data processing logic here
        result = process_data(country, demo_data, max_records, confidence)
        
        # Update task with success
        update_task_status(task_id, pipeline_id, "SUCCESS", "Processing completed", 100, result)
        
        return result
        
    except Exception as e:
        # Update task with error
        update_task_status(task_id, pipeline_id, "ERROR", f"Error: {str(e)}", 100)
        raise

def process_data(country, demo_data, max_records, confidence):
    """Example data processing function."""
    # Simulate data processing
    import time
    time.sleep(2)
    
    return {
        "country": country,
        "records_processed": max_records,
        "confidence_score": confidence,
        "demo_data_used": demo_data,
        "status": "completed"
    }

def update_task_status(task_id, pipeline_id, status, message, progress, result=None):
    """Update Iaso task status via API."""
    try:
        import requests
        from openhexa.sdk import workspace
        
        # Get Iaso connection
        connection = workspace.custom_connection("iaso-pipeline")
        token = connection.value
        
        # API endpoint for updating task status
        api_url = f"{connection.url}/api/openhexa/pipelines/{pipeline_id}/"
        
        # Prepare update data
        update_data = {
            "task_id": task_id,
            "status": status,
            "progress_message": message,
            "progress_value": progress,
            "end_value": 100,
            "result": result
        }
        
        # Send update request
        response = requests.patch(
            api_url,
            json=update_data,
            headers={"Authorization": f"Bearer {token}"},
            timeout=30
        )
        
        if response.status_code == 200:
            current_run.log_info(f"Task status updated: {status}")
        else:
            current_run.log_error(f"Failed to update task status: {response.status_code}")
            
    except Exception as e:
        current_run.log_error(f"Error updating task status: {str(e)}")

if __name__ == "__main__":
    my_pipeline()
```

### 4. Publish Pipeline

```bash
# Push pipeline to OpenHexa
openhexa pipelines push pipeline.py --code my-pipeline --name "v1.0" --description "Initial version"
```

## Pipeline Development

### 1. Local Development Setup

For local development, you need to set up ngrok to allow OpenHexa to communicate with your local Iaso instance:

#### Install ngrok

```bash
# Install ngrok (macOS with Homebrew)
brew install ngrok

# Or download from https://ngrok.com/
```

#### Start ngrok Tunnel

```bash
# Start tunnel to your local Iaso instance (usually port 8081)
ngrok http 8081
```

This will provide a public URL like `https://abc123.ngrok.io` that forwards to your local Iaso instance.

#### Update OpenHexa Connection

In your OpenHexa workspace, create a custom connection:

- **Connection Name**: `iaso-pipeline`
- **Connection Type**: `Custom`
- **URL**: `https://abc123.ngrok.io` (your ngrok URL)
- **Token**: Your Iaso API token

### 2. Pipeline Testing

```bash
# Test pipeline locally
python pipeline.py

# Run pipeline on OpenHexa
openhexa pipelines run my-pipeline --config '{"country": "Burkina Faso", "demo_data": true}'
```

## Task Management

### 1. Task Creation

Tasks are automatically created when launching pipelines through the Iaso API:

```python
# Example task creation in Iaso
task = Task.objects.create(
    name=f"OpenHexa Pipeline: {pipeline_name}",
    status="QUEUED",
    launcher=user,
    account=account,
    params={
        "pipeline_id": pipeline_id,
        "version": version_id,
        "config": parameter_values
    }
)
```

### 2. Task Status Updates

Pipelines can update task status through the API:

```python
# PATCH /api/openhexa/pipelines/{pipeline_id}/
{
    "task_id": "task-uuid",
    "status": "RUNNING|SUCCESS|ERROR",
    "progress_message": "Processing data...",
    "progress_value": 50,
    "end_value": 100,
    "result": {"key": "value"}
}
```

### 3. Task Status Values

| Status | Description |
|--------|-------------|
| `QUEUED` | Task is waiting to be executed |
| `RUNNING` | Task is currently executing |
| `SUCCESS` | Task completed successfully |
| `ERROR` | Task failed with an error |
| `CANCELLED` | Task was cancelled |

## Development Utilities

### OpenHexa Configuration Utilities

Iaso provides utility functions and decorators in `iaso/utils/openhexa.py` to simplify OpenHexa integration:

#### get_openhexa_config(account)

Retrieves OpenHexa configuration for a given account.

```python
from iaso.utils.openhexa import get_openhexa_config
from django.core.exceptions import ValidationError

try:
    openhexa_url, openhexa_token, workspace_slug, workspace = get_openhexa_config(account)
    # Use the configuration
except ValidationError as e:
    # Handle missing or invalid configuration
    print(f"Configuration error: {e}")
```

**Returns**: Tuple of `(openhexa_url, openhexa_token, workspace_slug, workspace)`

**Raises**: `ValidationError` if configuration is missing or invalid

#### @require_openhexa_config Decorator

Decorator for API view methods that automatically handles configuration retrieval and error responses:

```python
from iaso.utils.openhexa import require_openhexa_config
from rest_framework.viewsets import ViewSet

class MyViewSet(ViewSet):
    @require_openhexa_config
    def my_endpoint(self, request, openhexa_config=None):
        openhexa_url, openhexa_token, workspace_slug, workspace = openhexa_config
        # Your logic here
        return Response({"status": "success"})
```

**Features**:
- Automatically extracts account from `request.user.iaso_profile.account`
- Returns 422 error if user has no profile or configuration is invalid
- Injects configuration as `openhexa_config` kwarg

#### @with_openhexa_config Decorator

Decorator for standalone functions, management commands, or Celery tasks:

```python
from iaso.utils.openhexa import with_openhexa_config
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    @with_openhexa_config
    def process_data(self, account, data, openhexa_config=None):
        openhexa_url, openhexa_token, workspace_slug, workspace = openhexa_config
        # Your logic here
```

**Features**:
- Accepts `account` as first parameter
- Raises `ValidationError` if configuration is invalid (caller must handle)
- Injects configuration as `openhexa_config` kwarg

### Usage Examples

#### In Management Commands

```python
from django.core.management.base import BaseCommand, CommandError
from django.core.exceptions import ValidationError
from iaso.models import Account
from iaso.utils.openhexa import get_openhexa_config

class Command(BaseCommand):
    def handle(self, *args, **options):
        account = Account.objects.get(id=42)
        
        try:
            openhexa_url, openhexa_token, workspace_slug, workspace = get_openhexa_config(account)
            # Process data with OpenHexa
        except ValidationError as e:
            raise CommandError(f"OpenHexa configuration error: {e}")
```

#### In Celery Tasks

```python
from celery import shared_task
from django.core.exceptions import ValidationError
from iaso.utils.openhexa import with_openhexa_config

@shared_task
@with_openhexa_config
def process_openhexa_export(account, export_id, openhexa_config=None):
    openhexa_url, openhexa_token, workspace_slug, workspace = openhexa_config
    # Process export
```

## API Integration

### 1. Configuration Check API

**Endpoint**: `GET /api/openhexa/pipelines/config/`

**Description**: Check if OpenHexa is configured for the current user's account.

**Response**:
```json
{
    "configured": true,
    "lqas_pipeline_code": "optional-code"
}
```

**Behavior**:
- Returns `configured: false` if user has no profile or configuration is missing
- Returns `configured: true` with optional fields if properly configured
- Does not return error for missing configuration (graceful degradation)

### 2. Pipeline List API

**Endpoint**: `GET /api/openhexa/pipelines/`

**Response**:
```json
{
    "results": [
        {
            "id": "pipeline-uuid",
            "name": "My Pipeline",
            "currentVersion": {
                "versionNumber": "v1.0"
            }
        }
    ]
}
```

### 2. Pipeline Details API

**Endpoint**: `GET /api/openhexa/pipelines/{pipeline_id}/`

**Response**:
```json
{
    "id": "pipeline-uuid",
    "name": "My Pipeline",
    "currentVersion": {
        "versionNumber": "v1.0",
        "id": "version-uuid",
        "parameters": [
            {
                "type": "str",
                "name": "Country",
                "code": "country",
                "default": "Burkina Faso",
                "required": true
            }
        ]
    }
}
```

### 3. Launch Pipeline API

**Endpoint**: `POST /api/openhexa/pipelines/{pipeline_id}/launch/`

**Request Body**:
```json
{
    "version": "version-uuid",
    "config": {
        "country": "Burkina Faso",
        "demo_data": true,
        "max_records": 1000
    }
}
```

**Response**:
```json
{
    "task": {
        "id": 123,
        "name": "pipeline-uuid-vversion-uuid",
        "status": "RUNNING",
        "progress_message": null,
        "progress_value": null,
        "end_value": null,
        "result": null,
        "updated_at": "2025-01-11T10:00:00Z"
    }
}
```

### 4. Update Task Status API

**Endpoint**: `PATCH /api/openhexa/pipelines/{pipeline_id}/`

**Request Body**:
```json
{
    "task_id": "task-uuid",
    "status": "SUCCESS",
    "progress_message": "Processing completed",
    "progress_value": 100,
    "end_value": 100,
    "result": {
        "records_processed": 1000,
        "status": "completed"
    }
}
```

## Frontend Integration

Iaso includes a simple frontend integration for OpenHexa pipelines that provides:

### Pipeline Management Interface

- **Pipeline List**: View all available OpenHexa pipelines at `/dashboard/pipelines/`
- **Pipeline Details**: Configure and launch pipelines at `/dashboard/pipelines/{pipeline_id}/`
- **Parameter Configuration**: Dynamic form generation based on pipeline parameters
- **Task Launching**: Submit pipeline configurations and monitor execution

### Key Features

- **Dynamic Parameter Forms**: Automatically generates input fields based on pipeline parameter types
- **Real-time Status Updates**: Shows pipeline execution progress and results
- **Parameter Validation**: Client-side validation for required parameters
- **Error Handling**: Displays clear error messages for failed operations


## Troubleshooting

### Common Issues

#### 1. "No OpenHEXA workspace configured for your account"

**Cause**: The account has no associated OpenHEXA workspace or the workspace configuration is incomplete.

**Solution**: Create or update the OpenHEXA configuration:

```python
from iaso.models import Account
from iaso.models.openhexa import OpenHEXAInstance, OpenHEXAWorkspace

# Get or create OpenHEXA instance
instance, created = OpenHEXAInstance.objects.get_or_create(
    name="Production OpenHEXA",
    defaults={
        "url": "https://your-openhexa-instance.com/graphql/",
        "token": "your-api-token"
    }
)

# Get the account
account = Account.objects.get(id=42)

# Create workspace for the account
workspace, created = OpenHEXAWorkspace.objects.get_or_create(
    account=account,
    defaults={
        "openhexa_instance": instance,
        "slug": "your-workspace-slug",
        "config": {}
    }
)
```

**Validation checklist**:
- ✅ OpenHEXAInstance exists with valid URL and token
- ✅ URL contains 'graphql' (e.g., `https://example.com/graphql/`)
- ✅ OpenHEXAWorkspace exists for the account
- ✅ Workspace has a non-empty slug
- ✅ Workspace is linked to an OpenHEXAInstance

#### 2. "User profile not found"

**Cause**: The user doesn't have an associated `iaso_profile`.

**Solution**: Ensure all users who need to access OpenHexa have an Iaso profile:

```python
from django.contrib.auth.models import User
from iaso.models import Profile, Account

user = User.objects.get(username="myuser")
account = Account.objects.get(id=42)

# Create profile if it doesn't exist
profile, created = Profile.objects.get_or_create(
    user=user,
    defaults={"account": account}
)
```

#### 3. "The provided config contains invalid key(s)"

**Cause**: The pipeline parameters don't match the expected parameter names.

**Solution**: Ensure all parameters in your pipeline are properly defined with `@parameter` decorators:
```python
@parameter("task_id", type=str, name="Task ID", required=True)
@parameter("pipeline_id", type=str, name="Pipeline ID", required=True)
```

#### 4. "OpenHEXA URL must contain 'graphql'"

**Cause**: The OpenHEXA instance URL doesn't contain the required 'graphql' keyword.

**Solution**: Update the instance URL to include the GraphQL endpoint:
```python
from iaso.models.openhexa import OpenHEXAInstance

instance = OpenHEXAInstance.objects.get(name="Production OpenHEXA")
instance.url = "https://your-openhexa-instance.com/graphql/"  # Must contain 'graphql'
instance.save()
```

#### 5. Local Development Issues

**Cause**: OpenHexa can't reach your local Iaso instance.

**Solution**: 
1. Use ngrok to create a public tunnel: `ngrok http 8081`
2. Update the OpenHexa connection URL to use the ngrok URL
3. Ensure your local Iaso instance is running on port 8081


### Useful Commands

```bash
# List OpenHexa workspaces
openhexa workspaces list

# Test pipeline locally
python pipeline.py

# Push pipeline to OpenHexa
openhexa pipelines push pipeline.py --code my-pipeline

# Run pipeline on OpenHexa
openhexa pipelines run my-pipeline

# Check pipeline status
openhexa pipelines status my-pipeline
```


## Additional Resources

- [OpenHexa Documentation](https://docs.openhexa.org/)
- [OpenHexa SDK Python](https://github.com/BLSQ/openhexa-sdk-python)
- [Iaso API Documentation](https://iaso.readthedocs.io/)
- [ngrok Documentation](https://ngrok.com/docs)

