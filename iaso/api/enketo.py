from logging import getLogger
from uuid import uuid4

from bs4 import BeautifulSoup as Soup  # type: ignore
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext as _
from rest_framework import permissions
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from hat.audit.models import log_modification, INSTANCE_API
from iaso.api.common import HasPermission
from iaso.dhis2.datavalue_exporter import InstanceExportError
from iaso.enketo import calculate_file_md5
from iaso.enketo import (
    enketo_settings,
    enketo_url_for_edition,
    enketo_url_for_creation,
    to_xforms_xml,
    inject_instance_id_in_form,
    EnketoError,
)
from iaso.enketo.enketo_xml import inject_xml_find_uuid
from iaso.models import Form, Instance, InstanceFile, OrgUnit, Project, Profile
from iaso.models import User

logger = getLogger(__name__)


def public_url_for_enketo(request, path):
    """Utility function, used for giving Enketo an url by which they can contact our Iaso server,
    so they can download form definitions"""

    resolved_path = request.build_absolute_uri(path)

    # This hack allow it to work in the docker-compose environment, where the server name from outside the container
    # network are not the same that in the inside.
    if enketo_settings().get("ENKETO_DEV"):
        resolved_path = resolved_path.replace("localhost:8081", "iaso:8081")
    return resolved_path


# Used by Create submission in Iaso Dashboard
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def enketo_create_url(request):
    form_id = request.data.get("form_id")
    period = request.data.get("period", None)
    org_unit_id = request.data.get("org_unit_id")
    return_url = request.data.get("return_url", None)

    uuid = str(uuid4())
    form = get_object_or_404(Form, id=form_id)

    i = Instance(
        form_id=form_id,
        name=form.name,
        period=period,
        uuid=uuid,
        org_unit_id=org_unit_id,
        project=form.projects.first(),
        file_name=str(uuid) + "xml",
        created_by=request.user,
        last_modified_by=request.user,
    )  # warning for access rights here
    i.save()

    try:
        if not return_url:
            return_url = request.build_absolute_uri("/dashboard/forms/submission/instanceId/%s" % i.id)
        edit_url = enketo_url_for_creation(
            server_url=public_url_for_enketo(request, "/api/enketo"),
            uuid=uuid,
            return_url=return_url,
        )

        return JsonResponse({"edit_url": edit_url}, status=201)
    except EnketoError as error:
        print(error)
        return JsonResponse({"error": str(error)}, status=409)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def enketo_public_create_url(request):
    """This endpoint is used by web page outside of IASO to fill a form for an org unit and period.

    See iaso/enketo/README.md for more information on the flow and how to test.

    Return an url to Enketo"""

    token = request.GET.get("token")
    form_id = request.GET.get("form_id")
    period = request.GET.get("period", None)
    source_ref = request.GET.get("external_org_unit_id")
    to_export = request.GET.get("to_export", False)
    return_url = request.GET.get("return_url", None)

    external_user_id = request.GET.get("external_user_id")
    try:
        project = Project.objects.get(external_token=token)
    except Project.DoesNotExist:
        return JsonResponse({"error": "Not Found", "message": "Project not found"}, status=400)
    try:
        form = Form.objects.get(form_id=form_id, projects=project)
    except Form.DoesNotExist:
        return JsonResponse({"error": "Not Found", "message": f"Form not found in project {project.name}"}, status=400)
    try:
        org_unit = OrgUnit.objects.get(source_ref=source_ref, version=project.account.default_version)
    except OrgUnit.DoesNotExist:
        return JsonResponse(
            {"error": "Not Found", "message": f"OrgUnit {source_ref} not found in project {project.name}"}, status=400
        )

    if not form in project.forms.all():
        return JsonResponse({"error": _("Unauthorized")}, status=401)

    if external_user_id:
        if external_user_id.strip() == "":
            return JsonResponse({"error": "Unauthorized", "message": "Empty external user id"}, status=401)
        profiles = Profile.objects.filter(external_user_id=external_user_id)
        if profiles.count() == 1:
            profile = profiles.first()
            if profile.account_id != project.account_id:
                return JsonResponse({"error": _("Unauthorized")}, status=401)
        else:
            account = project.account
            user = User.objects.create(username="external-%s" % external_user_id)
            user.save()
            profile = Profile.objects.create(external_user_id=external_user_id, user=user, account=account)
    else:
        profile = None

    instances = (
        Instance.objects.filter(form_id=form.id, period=period, org_unit_id=org_unit.id)
        .exclude(file="")
        .exclude(deleted=True)
    )
    if instances.count() > 1 and form.single_per_period:
        return JsonResponse(
            {
                "error": "Ambiguous request",
                "message": _(
                    "There are multiple submissions for this period and organizational unit, please log in the dashboard to fix."
                ),
            },
            status=400,
        )

    if instances.count() == 1 and form.single_per_period:  # edition
        instance = instances.first()

        instance.to_export = to_export == "true"
        instance.save()
        user_id = None
        if profile:
            user_id = profile.user.id
        url_for_edition = _build_url_for_edition(request, instance, user_id)
        return JsonResponse({"url": url_for_edition}, status=201)
    else:  # creation
        uuid = str(uuid4())
        instance = Instance.objects.create(
            form_id=form.id,
            name=form.name,
            period=period,
            uuid=uuid,
            org_unit_id=org_unit.id,
            project=project,
            file_name=uuid + "xml",
            to_export=(to_export == "true"),
        )

        try:
            if not return_url:
                return_url = request.build_absolute_uri("/dashboard/forms/submission/instanceId/%s" % instance.id)
            edit_url = enketo_url_for_creation(
                server_url=public_url_for_enketo(request, "/api/enketo"), uuid=uuid, return_url=return_url
            )

            return JsonResponse({"url": edit_url}, status=201)
        except EnketoError as error:
            print(error)
            return JsonResponse({"error": str(error)}, status=409)


# TODO : Check if this is used
def enketo_public_launch(request, form_uuid, org_unit_id, period=None):
    form = get_object_or_404(Form, uuid=form_uuid)

    org_unit = get_object_or_404(OrgUnit, id=org_unit_id)
    uuid = str(uuid4())
    i = Instance(
        form_id=form.id,
        name=form.name,
        period=period,
        uuid=uuid,
        org_unit=org_unit,
        project=form.projects.first(),
        file_name=str(uuid) + "xml",
    )  # warning for access rights here
    i.save()

    try:
        edit_url = enketo_url_for_creation(server_url=public_url_for_enketo(request, "/api/enketo"), uuid=uuid)

        return HttpResponseRedirect(edit_url)
    except EnketoError as error:
        return HttpResponse(str(error), status=409)


def _build_url_for_edition(request, instance, user_id=None):
    # Construct a modified XML from the initial one, with some custom value we want Enketo to pass around
    # then send it as POST to enketo that will return an url for us
    instance_xml = instance.file.read()
    version_id = instance.form.latest_version.version_id
    instance_uuid, new_xml = inject_xml_find_uuid(
        instance_xml, instance_id=instance.id, version_id=version_id, user_id=user_id
    )

    edit_url = enketo_url_for_edition(
        public_url_for_enketo(request, "/api/enketo"),
        form_id_string=instance.uuid,
        instance_xml=new_xml,
        instance_id=instance_uuid,
        return_url=request.GET.get("return_url", public_url_for_enketo(request, "")),
    )
    return edit_url


@api_view(["GET"])
@permission_classes([HasPermission("menupermissions.iaso_update_submission")])  # type: ignore
def enketo_edit_url(request, instance_uuid):
    """Used by Edit submission feature in Iaso Dashboard.
    Restricted to user with the `update submission` permission, to submissions in their account.

    Return an url  in the Enketo service that the front end will redirect to."""
    instance = Instance.objects.filter(uuid=instance_uuid, project__account=request.user.iaso_profile.account).first()

    if instance is None:
        return JsonResponse({"error": "No such instance or not allowed"}, status=404)
    try:
        instance.to_export = False  # could be controlled but, by default, for a normal edit, no auto export
        edit_url = _build_url_for_edition(request, instance, request.user.id)
    except EnketoError as error:
        print(error)
        return JsonResponse({"error": str(error)}, status=409)

    return JsonResponse({"edit_url": edit_url}, status=201)


@api_view(["GET", "HEAD"])
@permission_classes([permissions.AllowAny])
def enketo_form_list(request):
    """Called by Enketo to get the list of form.

    Require a param `formID` which is actually an Instance UUID"""
    form_id_str = request.GET["formID"]
    try:
        i = Instance.objects.exclude(deleted=True).get(uuid=form_id_str)
    except Instance.MultipleObjectsReturned:
        logger.exception("Instance duplicate  uuid when editing")
        # Prioritize instance with a json content, and then the more recently updated
        i = Instance.objects.exclude(deleted=True).filter(uuid=form_id_str).order_by("json", "-updated_at").first()

    latest_form_version = i.form.latest_version
    # will it work through s3, what about "signing" infos if they expires ?
    downloadurl = public_url_for_enketo(request, "/api/enketo/formDownload/?uuid=%s" % i.uuid)

    if request.method == "GET":
        xforms = to_xforms_xml(
            i.form,
            download_url=downloadurl,
            version=latest_form_version.version_id,
            md5checksum=calculate_file_md5(latest_form_version.file),
            new_form_id=form_id_str,
        )

        return HttpResponse(xforms, content_type="application/xml")
    else:
        return HttpResponse(content_type="application/xml")


@api_view(["GET", "HEAD"])
@permission_classes([permissions.AllowAny])
def enketo_form_download(request):
    """Called by Enketo to Download the form definition as an XML file (the list of question and so on)

    Require a param `formID` which is actually an Instance UUID.
    We insert the instance Id In the form definition so the "Form" is unique per instance.
    """
    uuid = request.GET.get("uuid")
    try:
        i = Instance.objects.get(uuid=uuid)
    except Instance.MultipleObjectsReturned:
        logger.exception("Instance duplicate  uuid when editing")
        # Prioritize instance with a json content, and then the more recently updated
        i = Instance.objects.filter(uuid=uuid).order_by("json", "-updated_at").first()
    xml_string = i.form.latest_version.file.read().decode("utf-8")
    injected_xml = inject_instance_id_in_form(xml_string, i.id)
    return HttpResponse(injected_xml, content_type="application/xml")


class EnketoSubmissionAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    http_method_names = ["post", "head", "get"]

    def head(self, request, format=None):
        """HEAD call to no max content size"""

        resp = HttpResponse("", status=status.HTTP_204_NO_CONTENT)
        resp["x-openrosa-accept-content-length"] = 100000000

        return resp

    get = head

    def post(self, request, format=None):
        """UPDATE"""
        if request.FILES:
            main_file = request.FILES["xml_submission_file"]
            xml = main_file.read()
            soup = Soup(xml, "xml")
            # should we add form_id criteria or instanceID is enough ?

            for c in soup:
                if c.attrs.get("iasoInstance", None):
                    instanceid = c.attrs["iasoInstance"]

            try:
                user_id = soup.meta.editUserID.contents[0].strip()
                user = User.objects.filter(id=user_id).first()
            except:
                user = None
            original = Instance.objects.get(id=instanceid)
            instance = Instance.objects.get(id=instanceid)

            if user:
                instance.last_modified_by = user
                if not instance.file:
                    instance.created_by = user

            instance.file = main_file
            instance.name = instance.form.name
            instance.json = {}
            instance.save()

            # copy-pasted from the "create" code
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
            if instance.to_export:
                try:
                    instance.export(force_export=True)
                except InstanceExportError as error:
                    return Response(
                        {
                            "result": "error",
                            "step": "export",
                            "message": error.message,
                            "description": error.descriptions,
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

            return Response({"result": "success"}, status=status.HTTP_201_CREATED)
        return Response()
