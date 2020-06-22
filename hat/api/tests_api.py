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

from hat.patient.models import Test
from hat.cases.models import Case
from hat.users.models import Profile
from hat.geo.models import Village
from .authentication import CsrfExemptSessionAuthentication


class TestsViewSet(viewsets.ViewSet):
    """
    API to allow creation or modification of tests.
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = ["menupermissions.x_locator", "menupermissions.x_case_cases"]

    def retrieve(self, request, pk=None):
        test = get_object_or_404(Test, pk=pk)
        return Response(test.as_dict())

    def partial_update(self, request, pk=None):
        if not request.user.is_superuser and not request.user.has_perm(
            "menupermissions.x_datas_patient_edition"
        ):
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

        new_test = get_object_or_404(Test, pk=pk)

        new_test.type = request.data.get("type", None)
        new_test.index = request.data.get("index", None)
        new_test.result = request.data.get("result", None)
        new_test.comment = request.data.get("comment", None)
        new_test.hidden = request.data.get("hidden", False)
        new_test.date = request.data.get("date", None)
        profile_id = request.data.get("tester", None)
        date = request.data.get("date", None)
        if date:
            new_test.date = dateparse.parse_datetime(date)

        tester = None
        if profile_id:
            tester = get_object_or_404(Profile, id=profile_id)

        new_test.tester = tester

        village_id = request.data.get("villageId", None)
        if village_id:
            village = get_object_or_404(Village, id=village_id)
            new_test.village = village
            new_test.location = Point(
                x=float(village.longitude), y=float(village.latitude), srid=4326,
            )

        clinical_signs = request.data.get("clinicalsigns", None)
        if clinical_signs:
            print("TODO, save clinical signs !!!")

        form_id = request.data.get("form")
        case_item = get_object_or_404(Case, id=form_id)
        current_case = request.data.get("currentCase")
        case_item.test_pl_gb_mm3 = current_case.get("test_pl_gb_mm3", None)
        case_item.test_pl_albumine = current_case.get("test_pl_albumine", None)
        case_item.test_pl_lcr = current_case.get("test_pl_lcr", None)
        case_item.test_pl_comments = current_case.get("test_pl_comments", None)
        case_item.update_from_test(new_test)
        case_item.save()
        new_test.form = case_item

        new_test.save()
        return Response(new_test.as_dict())

    def create(self, request):
        if not request.user.is_superuser and not request.user.has_perm(
            "menupermissions.x_datas_patient_edition"
        ):
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

        new_test = Test()

        new_test.type = request.data.get("type", None)
        new_test.index = request.data.get("index", None)
        new_test.result = request.data.get("result", None)
        new_test.comment = request.data.get("comment", None)
        new_test.hidden = request.data.get("hidden", False)
        profile_id = request.data.get("tester", None)
        date = request.data.get("date", None)
        if date:
            new_test.date = dateparse.parse_datetime(date)

        tester = None
        if profile_id:
            tester = get_object_or_404(Profile, id=profile_id)

        new_test.tester = tester

        village_id = request.data.get("villageId", None)
        if village_id:
            village = get_object_or_404(Village, id=village_id)
            new_test.village = village
            print(village.longitude)
            new_test.location = Point(
                x=float(village.longitude), y=float(village.latitude), srid=4326,
            )

        clinical_signs = request.data.get("clinicalsigns", None)
        if clinical_signs:
            print("TODO, save clinical signs !!!")

        form_id = request.data.get("form")
        case_item = get_object_or_404(Case, id=form_id)
        current_case = request.data.get("currentCase")
        case_item.test_pl_gb_mm3 = current_case.get("test_pl_gb_mm3", None)
        case_item.test_pl_result = current_case.get("test_pl_result", None)
        case_item.test_pl_albumine = current_case.get("test_pl_albumine", None)
        case_item.test_pl_lcr = current_case.get("test_pl_lcr", None)
        case_item.test_pl_comments = current_case.get("test_pl_comments", None)
        case_item.update_from_test(new_test)
        case_item.save()
        new_test.form = case_item

        new_test.save()

        return Response(new_test.as_dict())
