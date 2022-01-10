from bs4 import BeautifulSoup as Soup
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status
from django.utils.translation import gettext as _
from iaso.enketo import (
    enketo_settings,
    enketo_url_for_edition,
    enketo_url_for_creation,
    to_xforms_xml,
    inject_userid_and_version,
    inject_instance_id_in_form,
    inject_instance_id_in_instance,
    EnketoError,
    ENKETO_FORM_ID_SEPARATOR,
)
from iaso.enketo import calculate_file_md5
from iaso.models import Form, Instance, InstanceFile, OrgUnit, Project, Profile

from hat.audit.models import log_modification, INSTANCE_API
from iaso.models import User
from uuid import uuid4


def public_url_for_enketo(request, path):
    resolved_path = request.build_absolute_uri(path)

    if enketo_settings().get("ENKETO_DEV"):
        resolved_path = resolved_path.replace("localhost:8081", "iaso:8081")
    return resolved_path


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def enketo_create_url(request):
    form_id = request.data.get("form_id")
    period = request.data.get("period", None)
    org_unit_id = request.data.get("org_unit_id")

    uuid = str(uuid4())
    form = get_object_or_404(Form, id=form_id)

    i = Instance(
        form_id=form_id,
        period=period,
        uuid=uuid,
        org_unit_id=org_unit_id,
        project=form.projects.first(),
        file_name=str(uuid) + "xml",
    )  # warning for access rights here
    i.save()

    try:
        edit_url = enketo_url_for_creation(
            server_url=public_url_for_enketo(request, "/api/enketo"),
            uuid=uuid,
            return_url=request.build_absolute_uri("/dashboard/forms/submission/instanceId/%s" % i.id),
        )

        return JsonResponse({"edit_url": edit_url}, status=201)
    except EnketoError as error:
        print(error)
        return JsonResponse({"error": str(error)}, status=409)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def enketo_public_create_url(request):
    token = request.GET.get("token")
    form_id = request.GET.get("form_id")
    period = request.GET.get("period", None)
    source_ref = request.GET.get("external_org_unit_id")
    to_export = request.GET.get("to_export", False)
    return_url = request.GET.get("return_url", None)

    external_user_id = request.GET.get("external_user_id")
    project = get_object_or_404(Project, external_token=token)
    form = get_object_or_404(Form, form_id=form_id, projects=project)
    org_unit = get_object_or_404(OrgUnit, source_ref=source_ref, version=project.account.default_version)

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
    if instances.count() > 1:
        return JsonResponse(
            {
                "error": "Ambiguous request",
                "message": _(
                    "There are multiple submissions for this period and organizational unit, please log in the dashboard to fix."
                ),
            },
            status=400,
        )

    if instances.count() == 1:  # edition
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


def enketo_public_launch(request, form_uuid, org_unit_id, period=None):
    form = get_object_or_404(Form, uuid=form_uuid)

    org_unit = get_object_or_404(OrgUnit, id=org_unit_id)
    uuid = str(uuid4())
    i = Instance(
        form_id=form.id,
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
    if user_id is None:
        user_id = request.user.id
    instance_xml = instance.file.read()
    soup = Soup(instance_xml, "xml")
    instance_id = soup.meta.instanceID.contents[0].strip().replace("uuid:", "")

    # inject editUserID in the meta section of the xml
    # to allow assign Modification to the user
    instance_xml = inject_userid_and_version(
        instance_xml.decode("utf-8"), user_id, instance.form.latest_version.version_id
    )
    instance_xml = inject_instance_id_in_instance(instance_xml, instance.id)

    edit_url = enketo_url_for_edition(
        public_url_for_enketo(request, "/api/enketo"),
        form_id_string=instance.uuid,
        instance_xml=instance_xml,
        instance_id=instance_id,
        return_url=request.GET.get("return_url", public_url_for_enketo(request, "")),
    )
    return edit_url


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def enketo_edit_url(request, instance_uuid):
    instance = Instance.objects.filter(uuid=instance_uuid, project__account=request.user.iaso_profile.account).first()

    if instance is None:
        return JsonResponse({"error": "No such instance or not allowed"}, status=404)
    try:
        instance.to_export = False  # could be controlled but, by default, for a normal edit, no auto export
        edit_url = _build_url_for_edition(request, instance)
    except EnketoError as error:
        print(error)
        return JsonResponse({"error": str(error)}, status=409)

    return JsonResponse({"edit_url": edit_url}, status=201)


@api_view(["GET", "HEAD"])
@permission_classes([permissions.AllowAny])
def enketo_form_list(request):
    form_id_str = request.GET["formID"]
    i = Instance.objects.get(uuid=form_id_str)
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
    uuid = request.GET.get("uuid")
    i = Instance.objects.get(uuid=uuid)
    xml_string = i.form.latest_version.file.read().decode("utf-8")
    injected_xml = inject_instance_id_in_form(xml_string, i.id)
    return HttpResponse(injected_xml, content_type="application/xml")


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

            # Prevent from rewriting created_by if modification
            if instance.file:
                try:
                    instance.last_modified_by = request.user
                except ValueError:
                    pass
            else:
                instance.created_by = request.user
                instance.last_modified_by = request.user

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
            if instance.to_export:
                instance.export(force_export=True)

            return Response({"result": "success"}, status=status.HTTP_201_CREATED)
        return Response()
