from django.contrib.gis.geos import Point
from django.core.paginator import Paginator
from django.db.models import OuterRef, Exists
from django.db.models import Q
from django.http import StreamingHttpResponse, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response
from django.utils import dateparse
from hat.sync.models import DeviceDB

from hat.patient.models import Treatment, Patient
from hat.cases.models import Case
from hat.users.models import Profile
from hat.geo.models import Village
from .authentication import CsrfExemptSessionAuthentication


class TreatmentsViewSet(viewsets.ViewSet):
    """
    API to allow creation or modification of treatmens.
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = ["menupermissions.x_locator", "menupermissions.x_case_cases"]

    def retrieve(self, request, pk=None):
        treatment = get_object_or_404(Treatment, pk=pk)
        return Response(treatment.as_dict())

    def partial_update(self, request, pk=None):
        if not request.user.is_superuser and not request.user.has_perm(
            "menupermissions.x_datas_patient_edition"
        ):
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

        new_treatment = get_object_or_404(Treatment, pk=pk)

        new_treatment.start_date = request.data.get("start_date")
        new_treatment.end_date = request.data.get("end_date", None)
        new_treatment.complete = request.data.get("complete", None)
        new_treatment.success = request.data.get("success", None)
        new_treatment.dead = request.data.get("dead", None)
        new_treatment.lost = request.data.get("lost", None)
        new_treatment.medicine = request.data.get("medicine", None)
        new_treatment.death_moment = request.data.get("death_moment", None)
        new_treatment.issues = request.data.get("issues", None)
        new_treatment.incomplete_reasons = request.data.get("incomplete_reasons", None)

        device = request.data.get("device", None)
        if device:
            device_id = device.get("device_id")
            device = get_object_or_404(DeviceDB, device_id=device_id)
        new_treatment.device = device

        new_treatment.save()
        return Response(new_treatment.as_dict())

    def create(self, request):
        if not request.user.is_superuser and not request.user.has_perm(
            "menupermissions.x_datas_patient_edition"
        ):
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

        new_treatment = Treatment()

        new_treatment.start_date = request.data.get("start_date")
        new_treatment.end_date = request.data.get("end_date", None)
        new_treatment.complete = request.data.get("complete", None)
        new_treatment.success = request.data.get("success", None)
        new_treatment.dead = request.data.get("dead", None)
        new_treatment.lost = request.data.get("lost", None)
        new_treatment.death_moment = request.data.get("death_moment", None)
        new_treatment.medicine = request.data.get("medicine", None)
        new_treatment.issues = request.data.get("issues", None)
        new_treatment.incomplete_reasons = request.data.get("incomplete_reasons", None)
        new_treatment.index = request.data.get("index", None)
        patient_id = request.data.get("patient_id")
        new_treatment.patient = get_object_or_404(Patient, pk=patient_id)

        device = request.data.get("device", None)
        if device:
            device_id = device.get("device_id")
            device = get_object_or_404(DeviceDB, device_id=device_id)
        new_treatment.device = device

        new_treatment.save()
        return Response(new_treatment.as_dict())
