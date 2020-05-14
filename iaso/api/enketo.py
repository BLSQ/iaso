from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import DataSource, OrgUnit

from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.http import HttpResponse
from rest_framework import status

from iaso.models import Instance, InstanceFile
from django.http import JsonResponse
import os
from bs4 import BeautifulSoup as Soup


class EnketoViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = (CsrfExemptSessionAuthentication,)
    permission_classes = []

    def list(self, request):
        print("Enketo !")
        print(self.request.GET)
        print(self.request.POST)
        return HttpResponse(
            open(
                os.path.join(os.path.dirname(__file__), "./fixtures/xforms.xml"),
                "r",
                encoding="utf-8",
            ).read(),
            content_type="application/xml",
        )

    def post(self, request):
        print("Enketo ! POST")
        print(self.request.GET)
        print(self.request.POST)
        import pdb

        pdb.set_trace()

        return HttpResponse(
            open(
                os.path.join(os.path.dirname(__file__), "./fixtures/xforms.xml"),
                "r",
                encoding="utf-8",
            ).read(),
            content_type="application/xml",
        )

    def getformxml(self, request):
        print("Enketo !")
        print(self.request.GET)
        print(self.request.POST)
        return HttpResponse(
            open(
                os.path.join(os.path.dirname(__file__), "./fixtures/sample-form.xml"),
                "r",
                encoding="utf-8",
            ).read(),
            content_type="application/xml",
        )

    def getsubmission(self, request):
        if request.method.upper() == "HEAD":
            resp = HttpResponse("", status=status.HTTP_204_NO_CONTENT)
            resp["x-openrosa-accept-content-length"] = 100000000
            return resp

        print("Enketo !")
        if request.FILES:
            # TODO version ?
            # versioning of changes
            # can we prevent "media files re upload ?"
            main_file = request.FILES["xml_submission_file"]

            soup = Soup(main_file.read(), "xml")
            form_id = [c for c in soup.children][0].attrs["id"]
            instanceid = soup.meta.instanceID.contents[0]

            import pdb

            pdb.set_trace()

            i, created = Instance.objects.get_or_create(file_name=main_file.name)
            i.file = request.FILES["xml_submission_file"]
            i.save()

            try:
                i.get_and_save_json_of_xml()
                try:
                    i.convert_location_from_field()
                    i.convert_device()
                except ValueError as error:
                    print(error)
            except:
                pass

            for file_name in request.FILES:
                if file_name != "xml_submission_file":
                    fi = InstanceFile()
                    fi.file = request.FILES[file_name]
                    fi.instance_id = i.id
                    fi.name = file_name
                    fi.save()

            return JsonResponse({"result": "success"}, status=201)
        print(self.request.GET)
        print(self.request.POST)
        return HttpResponse(
            open(
                os.path.join(os.path.dirname(__file__), "./fixtures/sample-form.xml"),
                "r",
                encoding="utf-8",
            ).read(),
            content_type="application/xml",
        )
