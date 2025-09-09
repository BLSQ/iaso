import logging

from django.shortcuts import get_object_or_404
from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

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
