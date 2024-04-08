import os
import zipfile

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from .serializers import ZipFileSerializer
from ..mobile.org_units import import_data as import_org_units
from ..instances import import_data as import_instances
from ..query_params import APP_ID
from ..serializers import AppIdSerializer
from ...models import Instance, InstanceFile

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

INSTANCES_JSON = "instances.json"
ORG_UNITS_JSON = "orgUnits.json"


class SynchronizeZipViewSet(ViewSet):
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
        user = self.request.user
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)
        serializer = ZipFileSerializer(data=request.data)
        try:
            zip_file = serializer.validateZipFile()
            try:
                with zipfile.ZipFile(zip_file, "r") as zip_ref:
                    with zip_ref.open(ORG_UNITS_JSON) as file:
                        import_org_units(file.read(), user, app_id)
                    with zip_ref.open(INSTANCES_JSON) as file:
                        import_instances(file.read(), user, app_id)

                    for file in zipfile.Path(zip_ref).iterdir():
                        if file.is_dir():
                            for instance_file in file.iterdir():
                                extracted_file = default_storage.save(
                                    f"{file.name}/{instance_file.name}", ContentFile(file.read())
                                )
                                if instance_file.name.endswith(".xml"):
                                    i = Instance.objects.get(uuid=file.name)
                                    i.created_by = user
                                    i.last_modified_by = user
                                    i.file = extracted_file
                                    i.save()
                                    i.get_and_save_json_of_xml()
                                    try:
                                        i.convert_location_from_field()
                                        i.convert_device()
                                        i.convert_correlation()
                                    except ValueError as error:
                                        print(error)
                                else:
                                    fi = InstanceFile()
                                    fi.file = extracted_file
                                    fi.instance_id = file.name
                                    fi.name = instance_file.name
                                    fi.save()

                return Response(data={}, status=status.HTTP_204_NO_CONTENT)
            except Exception as e:
                # Handle any errors that occur during processing
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except ValueError:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
