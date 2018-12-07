from rest_framework import viewsets

from rest_framework.response import Response

from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User

from hat.vector_control.models import Site
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class SitesViewSet(viewsets.ViewSet):
    """
    Team API to allow create and retrieval of sites.

    list:
    Returns the list of existing sites

    retrieve:
    returns a given sites information
    example: /api/sites/2/

    create:
    To insert an array of sites, send a POST to this URL
    Example: PUT on /api/sites/ with JSON body
    [{
        "id":"2",
        "count": 10,
        "total": 100

    }]

    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    permission_required = [
        'menupermissions.x_vectorcontrol'
    ]

    def list(self, request):
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        queryset = Site.objects.all()
        if from_date is not None:
            queryset = queryset.filter(first_survey_date__date__gte=from_date)
        if to_date is not None:
            queryset = queryset.filter(first_survey_date__date__lte=to_date)

        return Response(queryset.values('id', 'latitude', 'longitude'))

    def retrieve(self, request, pk=None):
        site = get_object_or_404(Site, pk=pk)

        return Response(site.as_dict())

    def create(self, request):
        sites = request.data
        new_sites = []
        for site in sites:
            new_site = Site()
            new_site.id = site.get('id', None)
            new_site.zone = site.get('zone', None)
            new_site.latitude = site.get('latitude', None)
            new_site.longitude = site.get('longitude', None)
            new_site.altitude = site.get('altitude', None)
            new_site.accuracy = site.get('accuracy', None)
            new_site.habitat = site.get('habitat', None)
            new_site.description = site.get('description', None)
            new_site.first_survey = site.get('first_survey', None)
            new_site.first_survey_date = site.get('first_survey_date', None)
            new_site.count = site.get('count', 0)
            new_site.total = site.get('total', 0)
            user_id = site.get('user', None)
            if user_id:
                newUser = get_object_or_404(User, pk=user_id)
                new_site.user = newUser
            new_site.source = 'API'
            new_site.save()
            new_sites.append(new_site)


        return Response([site.as_dict() for site in new_sites])


