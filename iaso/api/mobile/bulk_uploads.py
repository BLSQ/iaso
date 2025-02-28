import datetime
import logging

from traceback import format_exc

from django.core.files.uploadhandler import TemporaryFileUploadHandler
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import serializers, status
from rest_framework.generics import get_object_or_404
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from hat.api_import.models import APIImport
from iaso.api.query_params import APP_ID
from iaso.api.serializers import AppIdSerializer
from iaso.models import Project
from iaso.tasks.process_mobile_bulk_upload import process_mobile_bulk_upload
from iaso.utils.s3_client import upload_file_to_s3


logger = logging.getLogger(__name__)


class ZipFileSerializer(serializers.Serializer):
    zip_file = serializers.FileField()

    def validateZipFile(self):
        if self.is_valid():
            return self.validated_data["zip_file"]
        raise ValueError("Zip file not valid")


class MobileBulkUploadsViewSet(ViewSet):
    parser_classes = [MultiPartParser]

    app_id_param = openapi.Parameter(
        name=APP_ID,
        in_=openapi.IN_QUERY,
        required=True,
        description="Application id",
        type=openapi.TYPE_STRING,
    )
    zip_file_param = openapi.Parameter(
        name="zip_file",
        in_=openapi.IN_FORM,
        required=True,
        description="file to import",
        type=openapi.TYPE_FILE,
    )

    @swagger_auto_schema(
        responses={
            204: "Import was successful",
            400: f"parameters '{APP_ID}' was not provided or post didn't contain an zip",
            404: "project for given app id doesn't exist",
        },
        manual_parameters=[app_id_param, zip_file_param],
    )
    def create(self, request):
        request.upload_handlers = [TemporaryFileUploadHandler(request)]

        current_user = self.request.user
        user = self.request.user
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)
        project = get_object_or_404(Project, app_id=app_id)
        serializer = ZipFileSerializer(data=request.data)

        try:
            zip_file = serializer.validateZipFile()

            timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H:%M:%S.%f")
            object_name = "/".join(
                [
                    "mobilebulkuploads",
                    app_id,
                    str(user.id),
                    f"mobilebulkupload-{timestamp}.zip",
                ]
            )

            api_import = APIImport.objects.create(
                user=user,
                import_type="bulk",
                json_body={"file": object_name},
            )

            upload_file_to_s3(file_name=zip_file.temporary_file_path(), object_name=object_name)

            process_mobile_bulk_upload(
                api_import_id=api_import.id,
                project_id=project.id,
                user=current_user,
            )

            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as exc:
            logger.exception(f"ValueError: {exc!s}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            api_import.has_problem = True
            api_import.exception = format_exc()
            api_import.save()
            logger.exception(f"Exception: {exc!s}")
            return Response(serializer.errors, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
