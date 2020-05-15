from bs4 import BeautifulSoup as Soup
from django.core.files.storage import get_storage_class
from django.http import HttpResponse, JsonResponse
from rest_framework import status, viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from iaso.enketo.enketo_url import enketo_settings, enketo_url
from iaso.enketo.md5_file import calculate_md5
from iaso.models import DataSource, Form, Instance, InstanceFile, OrgUnit

from .auth.authentication import CsrfExemptSessionAuthentication


def public_url_for_enketo(request, path):
    if enketo_settings().get("ENKETO_DEV"):
        return "http://docker-host:8081" + path

    return request.build_absolute_uri(path)


class EnketoViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = (CsrfExemptSessionAuthentication,)
    permission_classes = []

    # Prepare enketo for for edit and return an edit url
    def edit_in_enketo(self, request, instance_uuid):
        instance = Instance.objects.filter(uuid=instance_uuid).first()
        if instance is None:
            return JsonResponse({"error": "no such instance"}, status=404)

        try:
            instance_xml = instance.file.read()
            soup = Soup(instance_xml, "xml")
            instanceid = soup.meta.instanceID.contents[0].strip().replace("uuid:", "")

            edit_url = enketo_url(
                enketo_settings(),
                public_url_for_enketo(request, "/api/enketo"),
                form_id_string=instance.form.form_id,
                instance_xml=instance_xml,
                instance_id=instanceid,
                return_url=request.GET.get(
                    "return_url", public_url_for_enketo(request, "")
                ),
            )

            return JsonResponse({"edit_url": edit_url}, status=201)
        except Exception as error:
            return JsonResponse({"error": str(error)}, status=409)

    def list(self, request):
        form = Form.objects.filter(form_id=request.GET["formID"]).first()
        lastest_form_version = form.latest_version
        # will it work through s3, what about "signing" infos ?
        downloadurl = public_url_for_enketo(request, lastest_form_version.file.url)
        content = [
            '<xforms xmlns="http://openrosa.org/xforms/xformsList">',
            "<xform>",
            "<formID>",
            form.form_id,
            "</formID>",
            "<name>",
            form.name,
            "</name>",
            "<version>" + lastest_form_version.version_id + "</version>",
            "<hash>md5:" + calculate_md5(lastest_form_version.file) + "</hash>",
            "<descriptionText>",
            form.name,
            "</descriptionText>",
            "<downloadUrl>",
            downloadurl,
            "</downloadUrl>",
            "</xform>",
            "</xforms>",
        ]

        return HttpResponse(("").join(content), content_type="application/xml")

    def post(self, request):
        pass
        # used in the config ?

    def getsubmission(self, request):
        if request.method.upper() == "HEAD":
            resp = HttpResponse("", status=status.HTTP_204_NO_CONTENT)
            resp["x-openrosa-accept-content-length"] = 100000000
            return resp

        if request.FILES:
            # TODO version ?
            # versioning of changes
            main_file = request.FILES["xml_submission_file"]

            soup = Soup(main_file.read(), "xml")
            # should we add form_id criteria or instanceID is enough ?
            form_id = [c for c in soup.children][0].attrs["id"]
            instanceid = soup.meta.deprecatedID.contents[0].strip()

            i = Instance.objects.filter(json__instanceID=instanceid).first()

            i.file = main_file
            i.json = {}
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
        return HttpResponse()
