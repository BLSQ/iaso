import logging

from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from iaso.api.openhexa.serializers import (
    OpenHexaConfigSerializer,
    PipelineLaunchSerializer,
    TaskResponseSerializer,
    TaskUpdateSerializer,
)
from iaso.api.tasks.views import ExternalTaskModelViewSet
from iaso.models.base import RUNNING
from iaso.models.json_config import Config
from iaso.models.task import Task


logger = logging.getLogger(__name__)

OPENHEXA_CONFIG_SLUG = "openhexa-config"


class MockConfig:
    """Mock Config object for pipeline configuration."""

    def __init__(self, content_dict):
        self.content = content_dict


def get_openhexa_config():
    """
    Retrieve OpenHexa configuration and validate URL.

    Returns:
        tuple: (openhexa_url, openhexa_token, workspace_slug)

    Raises:
        Response: HTTP 422 if configuration not found or invalid
    """
    try:
        openhexa_config = get_object_or_404(Config, slug=OPENHEXA_CONFIG_SLUG)
        openhexa_url = openhexa_config.content["openhexa_url"]
        openhexa_token = openhexa_config.content["openhexa_token"]
        workspace_slug = openhexa_config.content["workspace_slug"]

        # Validate that the URL contains 'graphql'
        if "graphql" not in openhexa_url.lower():
            logger.error(f"OpenHexa URL does not contain 'graphql': {openhexa_url}")
            raise ValueError("OpenHexa URL must contain 'graphql'")

        return openhexa_url, openhexa_token, workspace_slug

    except Exception as e:
        logger.exception(f"Could not fetch openhexa config for slug {OPENHEXA_CONFIG_SLUG}")
        # Return a simple error response instead of raising an exception
        return Response({"error": _("OpenHexa configuration not found")}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)


class OpenHexaPipelinesViewSet(ViewSet):
    """
    OpenHexa Pipelines API

    This API provides access to OpenHexa pipelines for listing, retrieving details, and launching tasks.

    GET /api/openhexa/pipelines/                    - List all pipelines
    GET /api/openhexa/pipelines/{id}/               - Get pipeline details
    POST /api/openhexa/pipelines/{id}/launch/       - Launch pipeline
    PATCH /api/openhexa/pipelines/{id}/             - Update task status
    GET /api/openhexa/config/                       - Check if OpenHexa config exists
    """

    def list(self, request):
        """
        Retrieve list of pipelines from OpenHexa workspace.

        Returns:
            Response: List of pipelines with id, name, and currentVersion
        """
        config_result = get_openhexa_config()
        if isinstance(config_result, Response):
            return config_result
        openhexa_url, openhexa_token, workspace_slug = config_result

        try:
            transport = RequestsHTTPTransport(
                url=openhexa_url,
                verify=True,
                headers={"Authorization": f"Bearer {openhexa_token}"},
            )
            client = Client(transport=transport, fetch_schema_from_transport=True)

            get_pipelines = gql(
                """
                query getPipelines($workspaceSlug: String!) {
                    pipelines(workspaceSlug: $workspaceSlug) {
                        items {
                            id
                            name
                            createdAt
                            currentVersion {
                                versionNumber
                            }
                        }
                    }
                }
                """
            )

            result = client.execute(get_pipelines, variable_values={"workspaceSlug": workspace_slug})

            logger.info(f"Successfully retrieved pipelines for workspace {workspace_slug}")
            # Return results in consistent format with other APIs
            pipelines_data = result.get("pipelines", {})
            items = pipelines_data.get("items", [])
            return Response({"results": items})

        except Exception as e:
            logger.exception(f"Could not retrieve pipelines for workspace {workspace_slug}")
            return Response({"error": _("Failed to retrieve pipelines")}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, pk=None):
        """
        Retrieve detailed information about a specific pipeline.

        Args:
            pk: The OpenHexa pipeline ID

        Returns:
            Response: Pipeline details including parameters
        """
        config_result = get_openhexa_config()
        if isinstance(config_result, Response):
            return config_result
        openhexa_url, openhexa_token, workspace_slug = config_result

        try:
            transport = RequestsHTTPTransport(
                url=openhexa_url,
                verify=True,
                headers={"Authorization": f"Bearer {openhexa_token}"},
            )
            client = Client(transport=transport, fetch_schema_from_transport=True)

            get_pipeline_detail = gql(
                """
                query getPipelineDetail($pipelineId: UUID!) {
                    pipeline(id: $pipelineId) {
                        id
                        name
                        code
                        currentVersion {
                            versionNumber
                            id
                            parameters {
                                type
                                name
                                code
                                default
                                choices
                                required
                                multiple
                            }
                        }
                    }
                }
                """
            )

            result = client.execute(get_pipeline_detail, variable_values={"pipelineId": pk})

            logger.info(f"Successfully retrieved details for pipeline {pk}")
            # Return the pipeline data directly without the wrapper
            return Response(result.get("pipeline", {}))

        except Exception as e:
            logger.exception(f"Could not retrieve pipeline details for {pk}: {str(e)}")
            return Response(
                {"error": _("Failed to retrieve pipeline details")}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=["post"])
    def launch(self, request, pk=None):
        """
        Launch a pipeline task with the provided configuration.

        Args:
            pk: The OpenHexa pipeline ID from URL
            request.data: Contains version, config

        Returns:
            Response: Created task information
        """
        # Get pipeline_id from URL parameter
        if not pk:
            return Response({"error": _("Pipeline ID is required")}, status=status.HTTP_400_BAD_REQUEST)

        # Validate request data (pipeline_id comes from URL, not request body)
        serializer = PipelineLaunchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        pipeline_id = pk  # Use pipeline ID from URL
        version = validated_data["version"]
        config = validated_data["config"]

        config_result = get_openhexa_config()
        if isinstance(config_result, Response):
            return config_result
        openhexa_url, openhexa_token, workspace_slug = config_result

        try:
            # Construct pipeline_config object for launch_task
            pipeline_config = MockConfig(
                {
                    "pipeline_version": str(version),  # Convert UUID to string
                    "pipeline": str(pipeline_id),
                    "oh_pipeline_target": None,
                    "openhexa_url": openhexa_url,
                    "openhexa_token": openhexa_token,
                }
            )

            # Create external task following the same pattern as powerbi.py
            user = request.user
            task_name = f"pipeline-{pipeline_id}-v{version}"

            task = Task.objects.create(
                created_by=user,
                launcher=user,
                account=user.iaso_profile.account,
                name=task_name,
                status=RUNNING,
                external=True,
                started_at=timezone.now(),
                should_be_killed=False,
                params={
                    "args": [],
                    "kwargs": {"pipeline_id": str(pipeline_id), "version": str(version), "config": config},
                },
            )

            # Launch the task using the existing launch_task function
            task_status = ExternalTaskModelViewSet.launch_task(
                slug=None,  # Not needed since we're passing pipeline_config
                config=config,
                task_id=task.pk,
                pipeline_config=pipeline_config,
            )

            # Update task status
            task.status = task_status
            task.save()

            logger.info(f"Successfully launched pipeline {pipeline_id} v{version} as task {task.pk}")

            # Use serializer for response
            serializer = TaskResponseSerializer(task)
            return Response({"task": serializer.data}, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.exception(f"Could not launch pipeline {pipeline_id}")
            return Response({"error": _("Failed to launch pipeline")}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, pk=None):
        """
        Update task status for a pipeline task.

        Args:
            pk: The OpenHexa pipeline ID (not used but required for URL pattern)
            request.data: Contains task_id, status, progress_message, progress_value, end_value

        Returns:
            Response: Updated task information
        """
        # Validate request data
        serializer = TaskUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        task_id = validated_data["id"]

        try:
            # Get the task
            task = get_object_or_404(Task, pk=task_id)

            # Check if task is external (should be for pipeline tasks)
            if not task.external:
                return Response({"error": _("Task is not external")}, status=status.HTTP_400_BAD_REQUEST)

            # Update task using proper Task model methods
            if "status" in validated_data:
                new_status = validated_data["status"]

                if new_status == "SUCCESS":
                    # Use Task model's success reporting method
                    result_data = validated_data.get("result")
                    message = validated_data.get("progress_message", "Pipeline completed successfully")
                    task.report_success_with_result(message, result_data)
                    progress_value = validated_data.get("progress_value")
                    end_value = validated_data.get("end_value")
                    if progress_value is not None:
                        task.progress_value = progress_value
                    if end_value is not None:
                        task.end_value = end_value
                    if progress_value is not None or end_value is not None:
                        task.save()
                elif new_status == "ERRORED":
                    # Use Task model's error reporting method
                    message = validated_data.get("progress_message", "Pipeline failed")
                    error = Exception(message)
                    task.report_failure(error)
                elif new_status == "RUNNING":
                    # Use Task model's progress reporting method
                    progress_value = validated_data.get("progress_value")
                    progress_message = validated_data.get("progress_message")
                    end_value = validated_data.get("end_value")
                    task.report_progress_and_stop_if_killed(
                        progress_value=progress_value, progress_message=progress_message, end_value=end_value
                    )
                else:
                    # For other statuses, update manually
                    task.status = new_status
                    if new_status in ["SKIPPED", "EXPORTED", "KILLED"]:
                        task.ended_at = timezone.now()
                    task.save()
            else:
                # If no status update, just update progress
                progress_value = validated_data.get("progress_value")
                progress_message = validated_data.get("progress_message")
                end_value = validated_data.get("end_value")
                if progress_value is not None or progress_message is not None or end_value is not None:
                    task.report_progress_and_stop_if_killed(
                        progress_value=progress_value, progress_message=progress_message, end_value=end_value
                    )

            logger.info(f"Successfully updated task {task_id} status to {task.status}")

            serializer = TaskResponseSerializer(task)
            return Response({"task": serializer.data}, status=status.HTTP_200_OK)

        except Http404:
            return Response({"error": _("Task not found")}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"Could not update task {task_id}")
            return Response({"error": _("Failed to update task")}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["get"])
    def config(self, request):
        """
        Check if OpenHexa configuration exists.

        Returns:
            Response: {"configured": true/false, "lqas_pipeline_code": "value" or null}
        """
        try:
            # Try to get the config
            openhexa_config = Config.objects.get(slug=OPENHEXA_CONFIG_SLUG)

            # Use serializer to validate configuration
            config_serializer = OpenHexaConfigSerializer(data=openhexa_config.content)
            configured = config_serializer.is_valid()

            response_data = {"configured": configured}

            # Get optional lqas_pipeline_code parameter if configuration is valid
            if configured and config_serializer.validated_data.get("lqas_pipeline_code"):
                response_data["lqas_pipeline_code"] = config_serializer.validated_data["lqas_pipeline_code"]
            if configured and config_serializer.validated_data.get("connection_name"):
                response_data["connection_name"] = config_serializer.validated_data["connection_name"]

            return Response(response_data)

        except Config.DoesNotExist:
            # Config doesn't exist
            return Response({"configured": False})
        except Exception as e:
            logger.exception(f"Error checking OpenHexa config: {str(e)}")
            return Response({"configured": False})
