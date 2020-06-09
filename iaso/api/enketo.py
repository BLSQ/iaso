from bs4 import BeautifulSoup as Soup
from django.http import HttpResponse, JsonResponse
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status
from iaso.enketo import (
    enketo_settings,
    enketo_url,
    to_xforms_xml,
    inject_userid,
    EnketoError,
)
from iaso.enketo import calculate_file_md5
from iaso.models import Form, Instance, InstanceFile

from hat.audit.models import log_modification, INSTANCE_API
from iaso.models import User


def public_url_for_enketo(request, path):
    if enketo_settings().get("ENKETO_DEV"):
        return "http://docker-host:8081" + path

    return request.build_absolute_uri(path)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def enketo_edit_url(request, instance_uuid):
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


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def enketo_form_list(request):
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


class EnketoSubmissionAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def head(self, request, format=None):
        """HEAD call to no max content size"""

        resp = HttpResponse("", status=status.HTTP_204_NO_CONTENT)
        resp["x-openrosa-accept-content-length"] = 100000000

        return resp

    def post(self, request, format=None):
        """UPDATE"""
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

            return Response({"result": "success"}, status=status.HTTP_201_CREATED)

        return Response()