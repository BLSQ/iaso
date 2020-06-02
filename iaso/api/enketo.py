from bs4 import BeautifulSoup as Soup
from django.core.files.storage import get_storage_class
from django.http import HttpResponse, JsonResponse
from rest_framework import status, viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response
from django.core.exceptions import PermissionDenied
from iaso.enketo import (
    enketo_settings,
    enketo_url,
    to_xforms_xml,
    inject_userid,
    EnketoError,
)
from iaso.enketo import calculate_file_md5
from iaso.models import DataSource, Form, Instance, InstanceFile, OrgUnit

from .auth.authentication import CsrfExemptSessionAuthentication
from hat.audit.models import log_modification, INSTANCE_API
from iaso.models import User


def public_url_for_enketo(request, path):
    if enketo_settings().get("ENKETO_DEV"):
        return "http://docker-host:8081" + path

    return request.build_absolute_uri(path)


# See REVERSE-ENKETO.md for more info
class EnketoViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = (CsrfExemptSessionAuthentication,)
    permission_classes = []

    # Prepare enketo for for edit and return an edit url
    def edit_in_enketo(self, request, instance_uuid):
        if request.user.is_anonymous:
            raise PermissionDenied("Please log in")

        instance = Instance.objects.filter(
            uuid=instance_uuid, project__account=request.user.iaso_profile.account
        ).first()

        if instance is None:
            return JsonResponse(
                {"error": "No such instance or not allowed"}, status=404
            )

        try:
            instance_xml = instance.file.read()
            soup = Soup(instance_xml, "xml")
            instanceid = soup.meta.instanceID.contents[0].strip().replace("uuid:", "")

            # inject editUserID in the meta section of the xml
            # to allow assign Modification to the user
            instance_xml = inject_userid(instance_xml.decode("utf-8"), request.user.id)

            edit_url = enketo_url(
                public_url_for_enketo(request, "/api/enketo"),
                form_id_string=instance.form.form_id + "-" + str(instance.form.id),
                instance_xml=instance_xml,
                instance_id=instanceid,
                return_url=request.GET.get(
                    "return_url", public_url_for_enketo(request, "")
                ),
            )

            return JsonResponse({"edit_url": edit_url}, status=201)
        except EnketoError as error:
            print(error)
            return JsonResponse({"error": str(error)}, status=409)

    def list(self, request):
        form_id_str = request.GET["formID"].split("-")
        form_id = form_id_str[-1]
        form = Form.objects.filter(id=form_id).first()
        lastest_form_version = form.latest_version
        # will it work through s3, what about "signing" infos if they expires ?
        downloadurl = public_url_for_enketo(request, lastest_form_version.file.url)

        xforms = to_xforms_xml(
            form,
            download_url=downloadurl,
            version=lastest_form_version.version_id,
            md5checksum=calculate_file_md5(lastest_form_version.file),
        )

        return HttpResponse(xforms, content_type="application/xml")

    # strangely the same endpoint is called for "update"
    def getsubmission(self, request):

        # HEAD call to no max content size
        if request.method.upper() == "HEAD":
            resp = HttpResponse("", status=status.HTTP_204_NO_CONTENT)
            resp["x-openrosa-accept-content-length"] = 100000000
            return resp

        # UPDATE
        if request.FILES:
            main_file = request.FILES["xml_submission_file"]
            soup = Soup(main_file.read(), "xml")
            # should we add form_id criteria or instanceID is enough ?

            instanceid = soup.meta.deprecatedID.contents[0].strip()
            user_id = soup.meta.editUserID.contents[0].strip()
            user = User.objects.filter(id=user_id).first()

            original = Instance.objects.filter(json__instanceID=instanceid).first()

            instance = Instance.objects.filter(json__instanceID=instanceid).first()

            instance.file = main_file
            instance.json = {}
            instance.save()

            # copy pasted from the create
            try:
                instance.get_and_save_json_of_xml()
                try:
                    instance.convert_location_from_field()
                    instance.convert_device()
                except ValueError as error:
                    print(error)
            except:
                pass

            for file_name in request.FILES:
                if file_name != "xml_submission_file":
                    fi = InstanceFile()
                    fi.file = request.FILES[file_name]
                    fi.instance_id = instance.id
                    fi.name = file_name
                    fi.save()

            log_modification(original, instance, source=INSTANCE_API, user=user)

            return JsonResponse({"result": "success"}, status=201)
        return HttpResponse()
