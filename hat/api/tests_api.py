from django.contrib.gis.geos import Point
from django.core.paginator import Paginator
from django.db.models import OuterRef, Exists
from django.db.models import Q
from django.http import StreamingHttpResponse, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response
from hat.api.export_utils import timestamp_to_utc_datetime

from hat.patient.models import Test
from hat.cases.models import Case
from hat.users.models import Profile
from hat.geo.models import Village
from hat.users.models import get_user_geo_list, is_authorized_user
from .authentication import CsrfExemptSessionAuthentication


class TestsViewSet(viewsets.ViewSet):
    """
    API to allow creation or modification of tests.

    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_locator', 'menupermissions.x_case_cases'
    ]

    def retrieve(self, request, pk=None):
        test = get_object_or_404(Test, pk=pk)
        return Response(test.as_dict())

    def partial_update(self, request, pk=None):
        new_test = get_object_or_404(Test, pk=pk)

        new_test.type = request.data.get("type", None)
        new_test.index = request.data.get("index", None)
        new_test.result = request.data.get("result", None)
        new_test.comment = request.data.get("comment", None)
        new_test.hidden = request.data.get("hidden", False)
        new_test.date = request.data.get("date", None)
        profile_id = request.data.get("tester", None)

        tester = None
        if profile_id:
            tester = get_object_or_404(Profile, id=profile_id)

        new_test.tester = tester

        village_id = request.data.get("villageId", None)
        if village_id:
            village = get_object_or_404(Village, id=village_id)
            new_test.village = village

        location = request.data.get("location", None)
        if location:
            new_test.location = Point(
                x=location.get("coordinates")[0],
                y=location.get("coordinates")[1],
                srid=4326,
            )


        form_id = request.data.get("form")
        form_item = get_object_or_404(Case, id=form_id)
        new_test.form = form_item
        new_test.save()
        return Response(new_test.as_dict())

    def create(self, request):
        new_test = Test()
        new_test.type = request.data.get("type", None)
        new_test.index = request.data.get("index", None)
        new_test.result = request.data.get("result", None)
        new_test.comment = request.data.get("comment", None)
        new_test.hidden = request.data.get("hidden", False)

        new_test.date = request.data.get("date", None)
        profile_id = request.data.get("tester", None)
        testerProfile = None
        if profile_id:
            testerProfile = get_object_or_404(Profile, id=profile_id)

        new_test.tester = testerProfile

        village_id = request.data.get("villageId", None)
        if village_id:
            village = get_object_or_404(Village, id=village_id)
            new_test.village = village

        location = request.data.get("location", None)
        if location:
            new_test.location = Point(
                x=location.get("coordinates")[0],
                y=location.get("coordinates")[1],
                srid=4326,
            )

        form_id = request.data.get("form")
        form_item = get_object_or_404(Case, id=form_id)
        new_test.form = form_item
        new_test.save()

        return Response(new_test.as_dict())
