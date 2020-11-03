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
    inject_userid_and_version,
    EnketoError,
    ENKETO_FORM_ID_SEPARATOR,
)
from iaso.enketo import calculate_file_md5
from iaso.models import Form, Instance, InstanceFile

from hat.audit.models import log_modification, INSTANCE_API
from iaso.models import User
from uuid import uuid4

def public_url_for_enketo(request, path):
    resolved_path = request.build_absolute_uri(path)

    if enketo_settings().get("ENKETO_DEV"):
        resolved_path = resolved_path.replace("localhost", "docker-host")

    return resolved_path


sample_xml = """<data xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:odk="http://www.opendatakit.org/xforms" id="%(odk_form_id)s" version="%(version)s">
          <meta>
            <instanceID>uuid:%(uuid)s</instanceID>
          </meta>
        </data>
"""

sample_xml = """<%(odk_form_id)s xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:orx="http://openrosa.org/xforms" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:odk="http://www.opendatakit.org/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa" id="%(odk_form_id)s" version="%(version)s"><meta><instanceID>uuid:%(uuid)s</instanceID></meta></%(odk_form_id)s>"""

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def enketo_create_url(request):
    form_id = request.data.get("form_id")
    period = request.data.get("period", None)
    org_unit_id =  request.data.get("org_unit_id")
    return_url = request.data.get("return_url")

    uuid = str(uuid4())
    form = Form.objects.get(id=form_id)
    latest_version = form.latest_version
    latest_version_xml = latest_version.file.read()
    latest_version_soup = Soup(latest_version_xml, "xml")

    #print("latest_version_xml", latest_version_xml)
    filled_xml = sample_xml % {"form_id": form.form_id, "uuid": uuid, "odk_form_id": form.form_id, "version": latest_version.version_id }
    #print("-----------------------------------filled_xml", filled_xml)
    filled_soup = Soup(filled_xml, 'xml')
    #print("-----------------------------------filled_soup", filled_soup)
    #print("-----------------------------------latest_version_soup", latest_version_soup)
    instance_xml = latest_version_soup.head.model.instance.data
    #print("-----------------------------------instance_xml", instance_xml)
    main_element = getattr(filled_soup, form.form_id)
    main_element.append(instance_xml)
    print("-----------------------------------filled_soup", filled_soup)

    i = Instance(form_id=form_id, period=period, uuid=uuid)
    i.save()

    try:
        edit_url = enketo_url(
            public_url_for_enketo(request, "/api/enketo"),
            form_id_string=form.form_id
            + ENKETO_FORM_ID_SEPARATOR
            + str(form.id)
            + ENKETO_FORM_ID_SEPARATOR
            + str(latest_version.version_id),
            instance_xml=filled_soup,
            instance_id=uuid,
            return_url=request.GET.get("return_url", public_url_for_enketo(request, "")),
        )

        return JsonResponse({"edit_url": edit_url}, status=201)
    except EnketoError as error:
        print(error)
        return JsonResponse({"error": str(error)}, status=409)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def enketo_edit_url(request, instance_uuid):
    instance = Instance.objects.filter(uuid=instance_uuid, project__account=request.user.iaso_profile.account).first()

    if instance is None:
        return JsonResponse({"error": "No such instance or not allowed"}, status=404)

    try:
        instance_xml = instance.file.read()
        soup = Soup(instance_xml, "xml")
        instanceid = soup.meta.instanceID.contents[0].strip().replace("uuid:", "")

        # inject editUserID in the meta section of the xml
        # to allow assign Modification to the user
        instance_xml = inject_userid_and_version(
            instance_xml.decode("utf-8"), request.user.id, instance.form.latest_version.version_id
        )

        edit_url = enketo_url(
            public_url_for_enketo(request, "/api/enketo"),
            form_id_string=instance.uuid,
            instance_xml=instance_xml,
            instance_id=instanceid,
            return_url=request.GET.get("return_url", public_url_for_enketo(request, "")),
        )

        return JsonResponse({"edit_url": edit_url}, status=201)
    except EnketoError as error:
        print(error)
        return JsonResponse({"error": str(error)}, status=409)


@api_view(["GET", "HEAD"])
@permission_classes([permissions.AllowAny])
def enketo_form_list(request):
    form_id_str = request.GET["formID"]
    i = Instance.objects.get(uuid=form_id_str)

    lastest_form_version = i.form.latest_version
    # will it work through s3, what about "signing" infos if they expires ?
    downloadurl = public_url_for_enketo(request, lastest_form_version.file.url)
    downloadurl = public_url_for_enketo(request, "/api/enketo/formDownload/?instance_id=%s" % i.id)
    downloadurl = "http://localhost:8081/api/enketo/formDownload/?instance_id=%s" % i.id
    xforms = to_xforms_xml(
        i.form,
        download_url=downloadurl,
        version=lastest_form_version.version_id,
        md5checksum=calculate_file_md5(lastest_form_version.file),
    )

    return HttpResponse(xforms, content_type="application/xml")

@api_view(["GET", "HEAD"])
@permission_classes([permissions.AllowAny])
def enketo_form_download(request):
    instance_id = request.GET.get("instance_id")
    i = Instance.objects.get(pk=instance_id)

    return HttpResponse(i.form.latest_version.file, content_type="application/xml")

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
            xml = main_file.read()
            soup = Soup(xml, "xml")
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
