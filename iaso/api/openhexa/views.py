import logging

from django.shortcuts import get_object_or_404
from django.utils import timezone
from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from iaso.api.openhexa.serializers import PipelineLaunchSerializer
from iaso.api.tasks.views import ExternalTaskModelViewSet
from iaso.models.base import RUNNING, Task
from iaso.models.json_config import Config


logger = logging.getLogger(__name__)

OPENHEXA_CONFIG_SLUG = "openhexa-config"


class PipelineListView(APIView):
    """
    List all OpenHexa pipelines for a workspace.
    """

    def get(self, request):
        """
        Retrieve list of pipelines from OpenHexa workspace.

        Returns:
            Response: List of pipelines with id, name, and currentVersion
        """
        try:
            # Retrieve OpenHexa configuration from Config object
            openhexa_config = get_object_or_404(Config, slug=OPENHEXA_CONFIG_SLUG)
            openhexa_url = openhexa_config.content["openhexa_url"]
            openhexa_token = openhexa_config.content["openhexa_token"]
            workspace_slug = openhexa_config.content["workspace_slug"]
        except Exception as e:
            logger.exception(f"Could not fetch openhexa config for slug {OPENHEXA_CONFIG_SLUG}: {str(e)}")
            return Response({"error": "OpenHexa configuration not found"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            logger.exception(f"Could not retrieve pipelines for workspace {workspace_slug}: {str(e)}")
            return Response({"error": "Failed to retrieve pipelines"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PipelineDetailView(APIView):
    """
    Get details of a specific OpenHexa pipeline.
    """

    def get(self, request, pipeline_id):
        """
        Retrieve detailed information about a specific pipeline.

        Args:
            pipeline_id: The OpenHexa pipeline ID

        Returns:
            Response: Pipeline details including parameters
        """
        try:
            # Retrieve OpenHexa configuration from Config object
            openhexa_config = get_object_or_404(Config, slug=OPENHEXA_CONFIG_SLUG)
            openhexa_url = openhexa_config.content["openhexa_url"]
            openhexa_token = openhexa_config.content["openhexa_token"]
        except Exception as e:
            logger.exception(f"Could not fetch openhexa config for slug {OPENHEXA_CONFIG_SLUG}: {str(e)}")
            return Response({"error": "OpenHexa configuration not found"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

            result = client.execute(get_pipeline_detail, variable_values={"pipelineId": pipeline_id})

            logger.info(f"Successfully retrieved details for pipeline {pipeline_id}")
            # Return the pipeline data directly without the wrapper
            return Response(result.get("pipeline", {}))

        except Exception as e:
            logger.exception(f"Could not retrieve pipeline details for {pipeline_id}: {str(e)}")
            return Response(
                {"error": "Failed to retrieve pipeline details"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, pipeline_id):
        """
        Launch a pipeline task with the provided configuration.

        Args:
            pipeline_id: The OpenHexa pipeline ID
            request.data: Contains version, config

        Returns:
            Response: Created task information
        """
        # Validate request data
        serializer = PipelineLaunchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        version = validated_data["version"]
        config = validated_data["config"]

        try:
            # Retrieve OpenHexa configuration from Config object
            openhexa_config = get_object_or_404(Config, slug=OPENHEXA_CONFIG_SLUG)
            openhexa_url = openhexa_config.content["openhexa_url"]
            openhexa_token = openhexa_config.content["openhexa_token"]
            workspace_slug = openhexa_config.content["workspace_slug"]
        except Exception as e:
            logger.exception(f"Could not fetch openhexa config for slug {OPENHEXA_CONFIG_SLUG}: {str(e)}")
            return Response({"error": "OpenHexa configuration not found"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            # Construct pipeline_config object for launch_task
            # We need to create a mock Config object that has a .content attribute
            class MockConfig:
                def __init__(self, content_dict):
                    self.content = content_dict

            pipeline_config = MockConfig(
                {
                    "pipeline_version": str(version),  # Convert UUID to string
                    "pipeline": str(pipeline_id),
                    "oh_pipeline_target": None,
                    "openhexa_url": openhexa_url,
                    "openhexa_token": openhexa_token,
                    "workspace_slug": workspace_slug,
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

            return Response(
                {
                    "task": {
                        "id": task.pk,
                        "name": task.name,
                        "status": task.status,
                        "created_at": task.created_at.isoformat(),
                        "pipeline_id": str(pipeline_id),
                        "version": str(version),
                        "result": task.result,
                    }
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.exception(f"Could not launch pipeline {pipeline_id}: {str(e)}")
            return Response({"error": "Failed to launch pipeline"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request, pipeline_id):
        """
        Update task status for a pipeline task.

        Args:
            pipeline_id: The OpenHexa pipeline ID (not used but required for URL pattern)
            request.data: Contains task_id, status, progress_message, progress_value, end_value

        Returns:
            Response: Updated task information
        """
        # Get task_id from request data
        task_id = request.data.get("task_id")
        if not task_id:
            return Response({"error": "task_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get the task
            task = get_object_or_404(Task, pk=task_id)

            # Check if task is external (should be for pipeline tasks)
            if not task.external:
                return Response({"error": "Task is not external"}, status=status.HTTP_400_BAD_REQUEST)

            # Update task fields
            if "status" in request.data:
                task.status = request.data["status"]
                # Set ended_at if task is completed
                if task.status in ["SUCCESS", "ERRORED", "KILLED"]:
                    task.ended_at = timezone.now()

            if "progress_message" in request.data:
                task.progress_message = request.data["progress_message"]

            if "progress_value" in request.data:
                task.progress_value = request.data["progress_value"]

            if "end_value" in request.data:
                task.end_value = request.data["end_value"]

            if "result_data" in request.data:
                # Store the pipeline result in the task's result field
                task.result = {"result": task.status, "data": request.data["result_data"]}

            task.save()

            logger.info(f"Successfully updated task {task_id} status to {task.status}")

            return Response(
                {
                    "task": {
                        "id": task.pk,
                        "name": task.name,
                        "status": task.status,
                        "progress_message": task.progress_message,
                        "progress_value": task.progress_value,
                        "end_value": task.end_value,
                        "result": task.result,
                        "updated_at": task.ended_at.isoformat() if task.ended_at else None,
                    }
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.exception(f"Could not update task {task_id}: {str(e)}")
            return Response({"error": "Failed to update task"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
