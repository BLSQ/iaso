from rest_framework import viewsets

from rest_framework.response import Response

from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator
from django.contrib.auth.models import User

from hat.vector_control.models import Site
from .authentication import CsrfExemptSessionAuthentication
from django.http import StreamingHttpResponse
from rest_framework.authentication import BasicAuthentication
import csv

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
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        csv_format = request.GET.get("csv", None)
        orders = request.GET.get("order", "first_survey_date").split(",")
        queryset = Site.objects.all().order_by(*orders)
        if from_date is not None:
            queryset = queryset.filter(first_survey_date__date__gte=from_date)
        if to_date is not None:
            queryset = queryset.filter(first_survey_date__date__lte=to_date)

        if csv_format is None:
            if limit:
                limit = int(limit)
                page_offset = int(page_offset)
                paginator = Paginator(queryset, limit)
                res = {"count": paginator.count}
                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)

                res["list"] = map(lambda x: x.as_dict(), page.object_list)
                res["has_next"] = page.has_next()
                res["has_previous"] = page.has_previous()
                res["page"] = page_offset
                res["pages"] = paginator.num_pages
                res["limit"] = limit
                return Response(res)
            else:
                return Response(queryset.values('id', 'latitude', 'longitude'))
        else:
                class Echo:
                    """An object that implements just the write method of the file-like
                    interface.
                    """

                    def write(self, value):
                        """Write the value by returning it, instead of storing in a buffer."""
                        return value

                def iter_items(queryset, pseudo_buffer):
                    headers = ['ID', 'Date première collecte', 'Nom', 'Zone', 'Latitude', 'Longitude', 'Altitude', 'Habitat', 'Décompte', 'Total']
                    writer = csv.writer(pseudo_buffer)
                    yield writer.writerow(headers)
                    for site in queryset.iterator(chunk_size=5000):
                        sdict = site.as_dict()
                        row = [
                            sdict.get("id"),
                            sdict.get("first_survey_date"),
                            sdict.get("name"),
                            sdict.get("zone"),
                            sdict.get("latitude"),
                            sdict.get("longitude"),
                            sdict.get("habitat"),
                            sdict.get("first_survey_date"),
                            sdict.get("count"),
                            sdict.get("total"),
                        ]
                        yield writer.writerow(row)

                response = StreamingHttpResponse(
                    streaming_content=(iter_items(queryset, Echo())),
                    content_type='text/csv',
                )
                response['Content-Disposition'] = 'attachment;filename=sites.csv'
                return response

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


