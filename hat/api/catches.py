from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.vector_control.models import Site, Catch, APIImport
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.contrib.gis.geos import Point
from datetime import datetime
from django.utils import timezone
import json

def timestamp_to_utc_datetime(timestamp):
    dt = datetime.fromtimestamp(int(timestamp/1000))
    new_datetime = timezone.make_aware(dt, timezone.utc)
    return new_datetime


class CatchesViewSet(viewsets.ViewSet):
    """
    Team API to allow create and retrieval of catches.

    list:
    Returns the list of existing catches

    retrieve:
    returns a given catches information
    example: /api/catches/2/

    create:
    To insert an array of catches, send a POST to this URL
    Example: PUT on /api/catches/ with JSON body
    [{
            "site_id": 18,
            "male_count": 10,
            "female_count": 50,
            "unknown_count": 50,
            "latitude": -2.75019127,
            "longitude": 19.68598159,
            ...
        },]



    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_vectorcontrol'
    ]


    def list(self, request):

        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        queryset = Catch.objects.all()

        if from_date is not None:
            queryset = queryset.filter(collect_date__date__gte=from_date)
        if to_date is not None:
            queryset = queryset.filter(collect_date__date__lte=to_date)
        queryset = queryset

        return Response(queryset.values('id', 'male_count', 'female_count', 'unknown_count', 'source'))

    def retrieve(self, request, pk=None):
        target = get_object_or_404(Catch, pk=pk)

        return Response(target.as_dict())

    def create(self, request):
        catches = request.data
        new_catches = []
        api_import = APIImport()
        api_import.user = request.user
        api_import.import_type = 'catch'
        api_import.json_body =catches
        api_import.save()
        for catch in catches:
            uuid = catch.get('uuid', None)
            existing_catches = Catch.objects.filter(uuid=uuid)

            if existing_catches:
                new_catch = existing_catches[0]

            else:
                new_catch = Catch()
                new_catch.uuid = uuid
                site_uuid = catch.get('site_uuid', None)
                site, created = Site.objects.get_or_create(uuid=site_uuid)

                new_catch.site = site
                new_catch.api_import = api_import
                start_time = catch.get('startTime', None)
                if start_time:
                    new_catch.setup_date = timestamp_to_utc_datetime(int(start_time))
                start_latitude = catch.get('startLatitude', None)
                start_longitude = catch.get('startLongitude', None)
                start_altitude = catch.get('startAltitude', 0)
                new_catch.start_accuracy = catch.get('startAccuracy', None)
                new_catch.user = request.user

                if start_latitude and start_longitude:
                    new_catch.start_location = Point(x=start_longitude, y=start_latitude, z=start_altitude, srid=4326)

            end_time = catch.get('endTime', None)
            if end_time:
                new_catch.collect_date = timestamp_to_utc_datetime(int(end_time))

            new_catch.male_count = catch.get('maleCount', 0)
            new_catch.female_count = catch.get('femaleCount', 0)
            new_catch.unknown_count = catch.get('unknownCount', 0)
            new_catch.accuracy = catch.get('accuracy', None)
            new_catch.remarks = catch.get('remarks', '')

            end_latitude = catch.get('endLatitude', None)
            end_longitude = catch.get('endLongitude', None)
            end_altitude = catch.get('endAltitude', 0)
            new_catch.end_accuracy = catch.get('endAccuracy', None)
            if end_latitude and end_longitude:
                new_catch.end_location = Point(x=end_longitude, y=end_latitude, z=end_altitude, srid=4326)

            new_catch.source = 'API'
            new_catch.save()
            new_catches.append(new_catch)

        return Response([catch.as_dict() for catch in new_catches])


