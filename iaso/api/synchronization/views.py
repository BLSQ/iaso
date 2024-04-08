import os
import zipfile
from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from .serializers import ZipFileSerializer
from ..mobile.org_units import import_data as import_org_units
from ..instances import import_data as import_instances
from ..serializers import AppIdSerializer
from ...models import Instance, InstanceFile

INSTANCES_JSON = "instances.json"
ORG_UNITS_JSON = "orgUnits.json"


class SynchronizeZipViewSet(ViewSet):
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
                                # TODO exract file somewhere
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

                return Response(status=status.HTTP_204_NO_CONTENT)
            except Exception as e:
                # Handle any errors that occur during processing
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except ValueError:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
