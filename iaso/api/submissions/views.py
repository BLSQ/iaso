from copy import copy
from typing import Any

from django.db import transaction
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.request import Request
from rest_framework.response import Response

from hat.api_import.models import APIImport
from iaso.api.submissions.audit import finish_audit, start_audit
from iaso.api.submissions.creation import (
    Batch,
    PreparedSubmission,
    SubmissionError,
    prepare_submission,
    save_submissions,
)
from iaso.api.submissions.edition import PreparedPatch, prepare_patch, save_patch
from iaso.api.submissions.permissions import HasSubmissionsReadPermission, HasSubmissionsUpdatePermission
from iaso.api.submissions.serializers import (
    SubmissionCreateSerializer,
    SubmissionErrorsSerializer,
    SubmissionPatchResultSerializer,
    SubmissionPatchSerializer,
    SubmissionsCreateSerializer,
    SubmissionSerializer,
    SubmissionsMultipartSerializer,
    SubmissionsResultSerializer,
)
from iaso.models import Instance
from iaso.odk.instance_editor import InstanceEditorUnavailable


class DryRunSerializer(serializers.Serializer):
    dry_run = serializers.BooleanField(default=False)


DRY_RUN_PARAMETER = OpenApiParameter(
    name="dry_run",
    type=OpenApiTypes.BOOL,
    location=OpenApiParameter.QUERY,
    description="Check everything (odk_cli included) without saving anything",
)


@extend_schema(tags=["Submissions"])
class SubmissionsViewSet(viewsets.GenericViewSet):
    """Submissions written from their flat content (`Instance.json` shape) instead of their XML: the XML is built and
    checked by odk_cli, as ODK Collect would. Reads are on `/api/instances/`."""

    permission_classes = [permissions.IsAuthenticated, HasSubmissionsUpdatePermission]
    serializer_class = SubmissionSerializer

    def get_permissions(self):
        if self.action == "retrieve":
            return [permissions.IsAuthenticated(), HasSubmissionsReadPermission()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        # without its content (a mobile upload half done), a submission has nothing to read back
        return Instance.objects.filter_for_user(user).filter_on_user_projects(user).filter(json__isnull=False)

    def retrieve(self, request: Request, pk=None) -> Response:
        """A submission in the shape `POST` and `PATCH` take: `content` is its flat content (`Instance.json`), with
        `_version`; `updated_at`, to detect a concurrent change."""
        return Response(self.get_serializer(self.get_object()).data)

    @extend_schema(
        request=SubmissionPatchSerializer,
        parameters=[DRY_RUN_PARAMETER],
        responses={
            200: OpenApiResponse(
                SubmissionPatchResultSerializer, description="Saved; dry_run: the submission as it would be"
            ),
            400: OpenApiResponse(SubmissionErrorsSerializer, description="Refused: nothing was saved"),
            403: OpenApiResponse(description="The submission is locked"),
            404: OpenApiResponse(description="No such submission for this user"),
            503: OpenApiResponse(description="odk_cli is unavailable"),
        },
    )
    def partial_update(self, request: Request, pk=None) -> Response:
        """Changes a submission's org unit, period and content (a merge patch on its flat content), checked by odk_cli
        as an edit in ODK Collect: the whole submission must be valid afterwards."""
        query = DryRunSerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        body = SubmissionPatchSerializer(data=request.data)
        if not body.is_valid():
            return Response(
                {"errors": [error.as_json() for error in _serializer_errors(body.errors)]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            queryset = self.get_queryset().select_related("form", "form_version", "org_unit")
            instance = get_object_or_404(queryset.select_for_update(of=("self",)), pk=pk)
            if not instance.can_user_modify(request.user):
                return Response(
                    {"detail": "This submission is locked by a higher level"}, status=status.HTTP_403_FORBIDDEN
                )
            try:
                patch, errors = prepare_patch(request.user, instance, body.validated_data)
            except InstanceEditorUnavailable:
                return _unavailable()
            if errors:
                return Response({"errors": [error.as_json() for error in errors]}, status=status.HTTP_400_BAD_REQUEST)
            warnings = [warning.as_json() for warning in patch.warnings]
            if query.validated_data["dry_run"]:
                return Response({"submission": _preview(patch), "warnings": warnings})
            instance = save_patch(patch, request.user)
        return Response({"submission": self.get_serializer(instance).data, "warnings": warnings})

    @extend_schema(
        request={
            "application/json": SubmissionsCreateSerializer,
            "multipart/form-data": SubmissionsMultipartSerializer,
        },
        parameters=[DRY_RUN_PARAMETER],
        responses={
            201: SubmissionsResultSerializer,
            200: OpenApiResponse(SubmissionsResultSerializer, description="dry_run: every submission is valid"),
            400: OpenApiResponse(SubmissionsResultSerializer, description="Refused: nothing was saved"),
            503: OpenApiResponse(description="odk_cli is unavailable"),
        },
    )
    def create(self, request: Request) -> Response:
        """Creates 1 to 100 submissions, all or none: one refused submission refuses the whole request.

        With files (images, documents...): multipart, the JSON in a `payload` part, one part per file; a binary
        question's answer is the name of its part."""
        query = DryRunSerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        files = {}
        data = request.data
        if request.content_type.startswith("multipart/"):
            multipart = SubmissionsMultipartSerializer(data=request.data)
            multipart.is_valid(raise_exception=True)
            data = multipart.validated_data["payload"]
            files = {name: request.FILES[name] for name in request.FILES}

        api_import = start_audit(request, data, files)
        batch = Batch(request.user, files)
        response = self._create(request, batch, data, query.validated_data["dry_run"], api_import)
        finish_audit(api_import, response, batch.project)
        if isinstance(response.data, dict):
            response.data["import_id"] = api_import.id
        return response

    def _create(self, request: Request, batch: Batch, data: Any, dry_run: bool, api_import: APIImport) -> Response:
        body = SubmissionsCreateSerializer(data=data)
        if not body.is_valid():
            return Response(body.errors, status=status.HTTP_400_BAD_REQUEST)
        results: list[dict[str, Any]] = []
        prepared: list[PreparedSubmission] = []
        for index, item in enumerate(body.validated_data["submissions"]):
            ref = item["ref"] if isinstance(item.get("ref"), str) else str(index)
            envelope = SubmissionCreateSerializer(data=item)
            if not envelope.is_valid():
                results.append(_refused(ref, list(_serializer_errors(envelope.errors))))
                continue
            try:
                submission, errors = prepare_submission(batch, ref, envelope.validated_data)
            except InstanceEditorUnavailable:
                return _unavailable()
            if errors:
                results.append(_refused(ref, errors))
                continue
            prepared.append(submission)
            results.append({"ref": ref, "status": "valid"})

        if len(prepared) < len(results):
            return Response({"results": results}, status=status.HTTP_400_BAD_REQUEST)
        if batch.unused_files():
            # every file sent must be one of a submission: a typo in an answer mustn't lose it silently
            return Response(
                {name: ["Not the answer of any submission"] for name in batch.unused_files()},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if dry_run:
            return Response({"results": [_result(submission) for submission in prepared]}, status=status.HTTP_200_OK)

        with transaction.atomic():
            instances = save_submissions(prepared, request.user, api_import)
        return Response(
            {
                "results": [
                    {**_result(submission), "status": submission.status, "id": instance.id}
                    for submission, instance in zip(prepared, instances)
                ]
            },
            status=status.HTTP_201_CREATED,
        )


def _unavailable() -> Response:
    return Response(
        {"detail": "Submissions can't be checked right now, try again later"},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


def _preview(patch: PreparedPatch) -> dict[str, Any]:
    """The submission as the patch would save it, nothing saved."""
    instance = copy(patch.instance)
    if patch.org_unit is not None:
        instance.org_unit = patch.org_unit
    if patch.period_changed:
        instance.period = patch.period
    if patch.json is not None:
        instance.json = patch.json
    return SubmissionSerializer(instance).data


def _result(submission: PreparedSubmission) -> dict[str, Any]:
    result = {
        "ref": submission.ref,
        "status": "valid",
        "uuid": submission.uuid,
        "form_version": submission.form_version.version_id,
    }
    if submission.warnings:
        result["warnings"] = [warning.as_json() for warning in submission.warnings]
    return result


def _refused(ref: str, errors: list[SubmissionError]) -> dict[str, Any]:
    return {"ref": ref, "status": "refused", "errors": [error.as_json() for error in errors]}


def _serializer_errors(errors: Any, prefix: str = ""):
    """DRF's nested errors as `SubmissionError`s, `field` as a dotted path (`location.latitude`)."""
    if isinstance(errors, dict):
        for name, value in errors.items():
            yield from _serializer_errors(value, f"{prefix}.{name}" if prefix else name)
    elif isinstance(errors, list):
        for value in errors:
            if isinstance(value, (dict, list)):
                yield from _serializer_errors(value, prefix)
            else:
                yield SubmissionError("INVALID", prefix or None, str(value))
