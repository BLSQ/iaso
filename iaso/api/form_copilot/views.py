import io
import logging

from django.core.files import File
from django.core.files.base import ContentFile
from django.http import FileResponse
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from iaso.api.form_versions.serializers import FormVersionSerializer
from iaso.models import Form, TemporaryForm
from iaso.modules import MODULE_FORM_COPILOT
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION

from .agent import build_xlsform, convert_to_xform_xml, generate_form, parse_xlsform_to_json, patch_xlsform_form_id


class HasFormCopilotPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if not request.user.has_perm(CORE_FORMS_PERMISSION.full_name()):
            return False
        account = request.user.iaso_profile.account
        return MODULE_FORM_COPILOT.codename in (account.modules or [])


logger = logging.getLogger(__name__)


class FormCopilotRequestSerializer(serializers.Serializer):
    message = serializers.CharField(help_text="User message describing the form to create or modify")
    conversation_history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
        help_text="Previous conversation messages",
    )
    existing_form_odk_id = serializers.CharField(
        required=False,
        allow_null=True,
        default=None,
        help_text="ODK form_id of the form being edited",
    )


class FormCopilotResponseSerializer(serializers.Serializer):
    assistant_message = serializers.CharField()
    xlsform_uuid = serializers.CharField(allow_null=True)
    conversation_history = serializers.ListField(child=serializers.DictField())


@extend_schema(
    tags=["Form Copilot"],
    request=FormCopilotRequestSerializer,
    responses={200: FormCopilotResponseSerializer},
)
@api_view(["POST"])
@permission_classes([HasFormCopilotPermission])
def form_copilot_chat(request):
    """AI-powered form generation endpoint.

    Send a natural language message to generate or modify an ODK XLSForm.
    The endpoint returns the assistant's response along with preview the XForm XML and
    a uuid to download the generated XLSForm.
    """
    serializer = FormCopilotRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    message = serializer.validated_data["message"]
    conversation_history = serializer.validated_data.get("conversation_history", [])
    existing_form_odk_id = serializer.validated_data.get("existing_form_odk_id")

    account = request.user.iaso_profile.account
    api_key = account.anthropic_api_key or None
    if not api_key:
        return Response(
            {"error": "Copilot API key is not configured for this account. Please contact your administrator."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        result = generate_form(message, conversation_history, existing_form_odk_id, api_key=api_key)
        form = result.pop("form")

        xlsform_uuid = None
        xform_xml = None
        if form is not None:
            xlsform_buffer = build_xlsform(form)
            xform_xml = convert_to_xform_xml(xlsform_buffer)
            temporary_form = TemporaryForm(
                user=request.user,
                account=request.user.iaso_profile.account,
            )
            temporary_form.save()
            xlsform_buffer.seek(0)
            temporary_form.xls_file.save("form.xlsx", ContentFile(xlsform_buffer.read()))
            xlsform_uuid = str(temporary_form.uuid)

        result["xlsform_uuid"] = xlsform_uuid
        result["xform_xml"] = xform_xml
        return Response(result, status=status.HTTP_200_OK)
    except Exception:
        logger.exception("Form copilot error")
        return Response(
            {"error": "Failed to generate form. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(tags=["Form Copilot"])
@api_view(["GET"])
@permission_classes([HasFormCopilotPermission])
def form_copilot_load_form(request, form_id):
    """Load an existing form's latest version for editing in the copilot.

    Returns the form's XLSForm structure as JSON (survey, choices, settings)
    plus the XForm XML for preview.
    """
    try:
        form = Form.objects.filter_for_user_and_app_id(request.user, None).distinct().get(id=form_id)
    except Form.DoesNotExist:
        return Response({"error": "Form not found"}, status=status.HTTP_404_NOT_FOUND)

    # Get the latest version
    latest_version = form.form_versions.order_by("-created_at").first()
    if not latest_version:
        return Response({"error": "Form has no versions"}, status=status.HTTP_404_NOT_FOUND)

    # Parse the XLS file into our JSON format
    if not latest_version.xls_file:
        return Response({"error": "Form version has no XLS file"}, status=status.HTTP_404_NOT_FOUND)

    try:
        xlsform_data = parse_xlsform_to_json(latest_version.xls_file.file)
    except Exception:
        logger.exception("Failed to parse XLS file for form %s", form_id)
        return Response(
            {"error": "Failed to parse form. The XLS file may be corrupted."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Get XForm XML for preview
    xform_xml = None
    if latest_version.file:
        try:
            xform_xml = latest_version.file.read().decode("utf-8")
        except Exception:
            logger.warning("Could not read XForm XML for form %s", form_id)

    return Response(
        {
            "form_id": form.id,
            "form_name": form.name,
            "form_odk_id": form.form_id,
            "version_id": latest_version.version_id,
            "xlsform_data": xlsform_data,
            "xform_xml": xform_xml,
        },
        status=status.HTTP_200_OK,
    )


@extend_schema(tags=["Form Copilot"])
@api_view(["GET"])
@permission_classes([HasFormCopilotPermission])
def form_copilot_download(request, form_uuid):
    """Download a previously generated XLSForm by its UUID.

    The file is served through an authenticated endpoint so the raw media
    path is never exposed to the client. Only the user who generated the
    form may download it.
    """
    try:
        temporary_form = TemporaryForm.objects.get(uuid=form_uuid, user=request.user)
    except TemporaryForm.DoesNotExist:
        return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)

    return FileResponse(
        temporary_form.xls_file.open("rb"),
        as_attachment=True,
        filename="form.xlsx",
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


class FormCopilotSaveSerializer(serializers.Serializer):
    form_id = serializers.IntegerField(help_text="ID of the iaso Form to save a new version for")
    xlsform_uuid = serializers.CharField(help_text="UUID returned by the chat endpoint")
    form_odk_id = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        default=None,
        help_text="Optional ODK form_id to write into the XLS settings before saving",
    )


@extend_schema(tags=["Form Copilot"])
@api_view(["POST"])
@permission_classes([HasFormCopilotPermission])
def form_copilot_save(request):
    """Save a generated XLSForm as a new FormVersion

    Resolves the XLS file from the server-side UUID and creates the FormVersion
    directly using the same serializer as /api/formversions/.
    """
    serializer = FormCopilotSaveSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    form_id = serializer.validated_data["form_id"]
    xlsform_uuid = serializer.validated_data["xlsform_uuid"]
    form_odk_id = serializer.validated_data.get("form_odk_id")

    try:
        temporary_form = TemporaryForm.objects.get(uuid=xlsform_uuid, user=request.user)
    except TemporaryForm.DoesNotExist:
        return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        raw_file = temporary_form.xls_file.open("rb")
        if form_odk_id:
            patched_buffer = patch_xlsform_form_id(io.BytesIO(raw_file.read()), form_odk_id)
            django_file = File(patched_buffer, name="form.xlsx")
        else:
            django_file = File(raw_file, name="form.xlsx")
        version_serializer = FormVersionSerializer(
            data={"form_id": form_id, "xls_file": django_file},
            context={"request": request, "view": None},
        )
        if not version_serializer.is_valid():
            return Response(version_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        version = version_serializer.save()

    except Exception:
        logger.exception("Failed to save form version for uuid %s", xlsform_uuid)
        return Response(
            {"error": "Failed to save form version. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {
            "id": version.id,
            "version_id": version.version_id,
            "form_id": version.form.id,
            "form_name": version.form.name,
        },
        status=status.HTTP_201_CREATED,
    )
