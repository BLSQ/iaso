from typing import Any

from django.db import transaction
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.request import Request
from rest_framework.response import Response

from iaso.api.submissions.creation import (
    Batch,
    PreparedSubmission,
    SubmissionError,
    prepare_submission,
    save_submissions,
)
from iaso.api.submissions.permissions import HasSubmissionsReadPermission, HasSubmissionsUpdatePermission
from iaso.api.submissions.serializers import (
    SubmissionCreateSerializer,
    SubmissionsCreateSerializer,
    SubmissionSerializer,
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
        request=SubmissionsCreateSerializer,
        parameters=[DRY_RUN_PARAMETER],
        responses={
            201: SubmissionsResultSerializer,
            200: OpenApiResponse(SubmissionsResultSerializer, description="dry_run: every submission is valid"),
            400: OpenApiResponse(SubmissionsResultSerializer, description="Refused: nothing was saved"),
            503: OpenApiResponse(description="odk_cli is unavailable"),
        },
    )
    def create(self, request: Request) -> Response:
        """Creates 1 to 100 submissions, all or none: one refused submission refuses the whole request."""
        query = DryRunSerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        body = SubmissionsCreateSerializer(data=request.data)
        body.is_valid(raise_exception=True)

        batch = Batch(request.user)
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
                return Response(
                    {"detail": "Submissions can't be checked right now, try again later"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            if errors:
                results.append(_refused(ref, errors))
                continue
            prepared.append(submission)
            results.append({"ref": ref, "status": "valid"})

        if len(prepared) < len(results):
            return Response({"results": results}, status=status.HTTP_400_BAD_REQUEST)
        if query.validated_data["dry_run"]:
            return Response({"results": [_result(submission) for submission in prepared]}, status=status.HTTP_200_OK)

        with transaction.atomic():
            instances = save_submissions(prepared, request.user)
        return Response(
            {
                "results": [
                    {**_result(submission), "status": submission.status, "id": instance.id}
                    for submission, instance in zip(prepared, instances)
                ]
            },
            status=status.HTTP_201_CREATED,
        )


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
