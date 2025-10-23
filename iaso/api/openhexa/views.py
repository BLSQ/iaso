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
    PipelineLaunchSerializer,
    TaskResponseSerializer,
    TaskUpdateSerializer,
)
from iaso.models.base import ERRORED, EXPORTED, KILLED, RUNNING, SKIPPED, SUCCESS
from iaso.models.openhexa import OpenHEXAWorkspace
from iaso.models.task import Task
from iaso.tasks.launch_openhexa_pipeline import launch_openhexa_pipeline
from iaso.utils.tokens import get_user_token


logger = logging.getLogger(__name__)


def get_openhexa_config(user):
    """
    Retrieve OpenHexa configuration from OpenHEXAWorkspace and OpenHEXAInstance models.

    Args:
        user: The authenticated user making the request

    Returns:
        tuple: (openhexa_url, openhexa_token, workspace_slug, workspace)

    Raises:
        Response: HTTP 422 if configuration not found or invalid
    """
    try:
        # Get the user's account
        account = user.iaso_profile.account

        # Fetch OpenHEXAWorkspace for this account
        try:
            workspace = OpenHEXAWorkspace.objects.select_related("openhexa_instance").get(account=account)
        except OpenHEXAWorkspace.DoesNotExist:
            logger.error(f"No OpenHEXA workspace configured for account '{account.name}' (ID: {account.id})")
            return Response(
                {"error": _("No OpenHEXA workspace configured for your account")},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        except OpenHEXAWorkspace.MultipleObjectsReturned:
            logger.error(f"Multiple OpenHEXA workspaces found for account '{account.name}' (ID: {account.id})")
            return Response(
                {"error": _("Multiple OpenHEXA workspaces configured for your account")},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        # Get workspace slug
        workspace_slug = workspace.slug
        if not workspace_slug:
            logger.error(f"OpenHEXA workspace for account '{account.name}' has no slug configured")
            return Response(
                {"error": _("OpenHEXA workspace has no slug configured")}, status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        # Get OpenHEXA instance configuration
        openhexa_instance = workspace.openhexa_instance
        openhexa_url = openhexa_instance.url
        openhexa_token = openhexa_instance.token

        if not openhexa_url:
            logger.error(f"OpenHEXA instance '{openhexa_instance.name}' has no URL configured")
            return Response(
                {"error": _("OpenHEXA instance has no URL configured")}, status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        if not openhexa_token:
            logger.error(f"OpenHEXA instance '{openhexa_instance.name}' has no token configured")
            return Response(
                {"error": _("OpenHEXA instance has no token configured")}, status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        # Validate that the URL contains 'graphql'
        if "graphql" not in openhexa_url.lower():
            logger.error(f"OpenHexa URL does not contain 'graphql': {openhexa_url}")
            return Response(
                {"error": _("OpenHEXA URL must contain 'graphql'")}, status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        return openhexa_url, openhexa_token, workspace_slug, workspace

    except AttributeError as e:
        logger.exception(f"User {user.id} has no iaso_profile or account")
        return Response({"error": _("User profile or account not found")}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
    except Exception as e:
        logger.exception(f"Could not fetch OpenHEXA config for user {user.id}")
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
        config_result = get_openhexa_config(request.user)
        if isinstance(config_result, Response):
            return config_result
        openhexa_url, openhexa_token, workspace_slug, workspace = config_result

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
        config_result = get_openhexa_config(request.user)
        if isinstance(config_result, Response):
            return config_result
        openhexa_url, openhexa_token, workspace_slug, workspace = config_result

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

        # Add connection token and host to config
        try:
            config["connection_token"] = get_user_token(request.user)
            # Build complete URL with scheme
            scheme = "https" if request.is_secure() else "http"
            host = request.get_host()
            config["connection_host"] = f"{scheme}://{host}"
        except Exception as e:
            logger.exception(f"Failed to generate connection token for user {request.user.id}: {str(e)}")
            return Response(
                {"error": _("Failed to generate authentication token")}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        config_result = get_openhexa_config(request.user)
        if isinstance(config_result, Response):
            return config_result
        openhexa_url, openhexa_token, workspace_slug, workspace = config_result

        try:
            user = request.user

            task = launch_openhexa_pipeline(
                user=user,
                pipeline_id=pipeline_id,
                openhexa_url=openhexa_url,
                openhexa_token=openhexa_token,
                version=str(version),
                config=config,
            )

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

                if new_status == SUCCESS:
                    # Use Task model's success reporting method
                    progress_value = validated_data.get("progress_value")
                    end_value = validated_data.get("end_value")
                    if progress_value is not None:
                        task.progress_value = progress_value
                    if end_value is not None:
                        task.end_value = end_value

                    result_data = validated_data.get("result")
                    message = validated_data.get("progress_message", "Pipeline completed successfully")
                    task.report_success_with_result(message, result_data)

                    # Only call save() if we manually set progress_value or end_value
                    if progress_value is not None or end_value is not None:
                        result_data = validated_data.get("result")
                        message = validated_data.get("progress_message", "Pipeline completed successfully")
                        task.report_success_with_result(message, result_data)
                    else:
                        # If no progress/end values, just update status and save
                        task.status = SUCCESS
                        task.ended_at = timezone.now()
                        task.save()
                elif new_status == ERRORED:
                    # Use Task model's error reporting method
                    message = validated_data.get("progress_message", "Pipeline failed")
                    error = Exception(message)
                    task.report_failure(error)
                elif new_status == RUNNING:
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
                    if new_status in [SKIPPED, EXPORTED, KILLED]:
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
        Check if OpenHexa configuration exists for the user's account.

        Returns:
            Response: {"configured": true/false, "lqas_pipeline_code": "value" or null}
        """
        try:
            # Get the user's account
            account = request.user.iaso_profile.account

            # Try to get the workspace
            workspace = OpenHEXAWorkspace.objects.select_related("openhexa_instance").get(account=account)

            # Check if all required fields are configured
            configured = bool(
                workspace.slug
                and workspace.openhexa_instance
                and workspace.openhexa_instance.url
                and workspace.openhexa_instance.token
            )

            response_data = {"configured": configured}

            # Get optional lqas_pipeline_code parameter from workspace config if configured
            if configured and workspace.config and workspace.config.get("lqas_pipeline_code"):
                response_data["lqas_pipeline_code"] = workspace.config["lqas_pipeline_code"]

            return Response(response_data)

        except (AttributeError, OpenHEXAWorkspace.DoesNotExist):
            # User has no profile/account or workspace doesn't exist
            return Response({"configured": False})
        except OpenHEXAWorkspace.MultipleObjectsReturned:
            # Multiple workspaces found - this is a configuration error but still "configured"
            logger.warning(f"Multiple OpenHEXA workspaces found for account {account.id}")
            return Response({"configured": True})
        except Exception as e:
            logger.exception(f"Error checking OpenHexa config: {str(e)}")
            return Response({"configured": False})
