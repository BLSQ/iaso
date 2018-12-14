from rest_framework import viewsets
from django.contrib.auth.models import User
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.vector_control.models import Site, Catch
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.contrib.gis.geos import Point


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
        catchs = request.data
        new_catchs = []
        for catch in catchs:
            male_count = catch.get('male_count', 0)
            female_count = catch.get('female_count', 0)
            unknown_count = catch.get('unknown_count', 0)
            new_catch = Catch()
            site_id = catch.get('site_id', None)
            if site_id:
                site = get_object_or_404(Site, id=site_id)
                site.total = male_count + female_count + unknown_count + site.total
                site.save()
                new_catch.site = site
            new_catch.operation = catch.get('operation', None)
            new_catch.setup_date = catch.get('setup_date', None)
            new_catch.collect_date = catch.get('collect_date', None)
            new_catch.in_out = catch.get('in_out', None)
            new_catch.male_count = male_count
            new_catch.female_count = female_count
            new_catch.unknown_count = unknown_count
            new_catch.remarks = catch.get('remarks', '')
            new_catch.distance_to_targets = catch.get('distance_to_targets', None)
            new_catch.near_intervention = catch.get('near_intervention', '')
            new_catch.elev_change = catch.get('elev_change', None)
            new_catch.trap_elev = catch.get('trap_elev', None)
            new_catch.target_elev = catch.get('target_elev', None)
            new_catch.elev_diff = catch.get('elev_diff', None)
            latitude = catch.get('latitude', None)
            longitude = catch.get('longitude', None)
            if latitude and longitude:
                new_catch.location = Point(x=longitude, y=latitude, srid=4326)
            user_id = catch.get('user', None)
            if user_id:
                newUser = get_object_or_404(User, pk=user_id)
                new_catch.user = newUser
            new_catch.source = 'API'
            new_catch.save()
            new_catchs.append(new_catch)


        return Response([catch.as_dict() for catch in new_catchs])


