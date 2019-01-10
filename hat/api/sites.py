from rest_framework import viewsets

from rest_framework.response import Response


from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator


from hat.vector_control.models import Site, APIImport, Catch
from .authentication import CsrfExemptSessionAuthentication
from django.http import StreamingHttpResponse, HttpResponse
from rest_framework.authentication import BasicAuthentication
from django.contrib.gis.geos import Point
from hat.geo.models import Province, ZS, AS
from django.db.models import OuterRef, Exists, Count, Sum, Case, When, Value
from .catches import timestamp_to_utc_datetime

from .export_utils import  Echo, generate_xlsx, iter_items


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
        xlsx_format = request.GET.get("xlsx", None)
        orders = request.GET.get("order", "created_at").split(",")
        user_ids = request.GET.get("userId", None)
        habitats = request.GET.get("habitats", None)
        only_reference_sites = request.GET.get("only_reference_sites", False)
        only_ignored_sites = request.GET.get("onlyIgnoredSites", False)
        province_ids = request.GET.get("province_id", None)
        zs_ids = request.GET.get("zs_id", None)
        as_ids = request.GET.get("as_id", None)
        queryset = Site.objects.all()

        if from_date is not None:
            queryset = queryset.filter(created_at__date__gte=from_date)
        if to_date is not None:
            queryset = queryset.filter(created_at__date__lte=to_date)
        if user_ids is not None:
            queryset = queryset.filter(user_id__in=user_ids.split(","))
        if habitats is not None:
            queryset = queryset.filter(habitat__in=habitats.split(","))
        if only_reference_sites:
            queryset = queryset.filter(is_reference=True)
        if only_ignored_sites:
            queryset = queryset.filter(ignore=True)
        else:
            queryset = queryset.filter(ignore=False)

        if province_ids:
            province_list = province_ids.split(",")
            prov_subquery = Province.objects.filter(id__in=province_list) \
                .filter(geom__contains=OuterRef("location"))
            queryset = queryset.annotate(in_prov=Exists(prov_subquery)).filter(in_prov=True)
        if zs_ids:
            zone_list = zs_ids.split(",")
            zs_subquery = ZS.objects.filter(id__in=zone_list) \
                .filter(geom__contains=OuterRef("location"))
            queryset = queryset.annotate(in_zs=Exists(zs_subquery)).filter(in_zs=True)
        if as_ids:
            area_list = as_ids.split(",")
            as_subquery = AS.objects.filter(id__in=area_list) \
                .filter(geom__contains=OuterRef("location"))
            queryset = queryset.annotate(in_as=Exists(as_subquery)).filter(in_as=True)

        queryset = queryset.annotate(catches_count=Count('catch'))
        queryset = queryset.annotate(catches_count_male=Sum('catch__male_count'))
        queryset = queryset.annotate(catches_count_female=Sum('catch__female_count'))
        queryset = queryset.annotate(catches_count_unknown=Sum('catch__unknown_count'))

        queryset = queryset.annotate(catches_count_total=Sum('catch__unknown_count') + Sum('catch__male_count') + Sum('catch__female_count'))
        queryset = queryset.order_by(*orders)

        if csv_format is None and xlsx_format is None:
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
                return Response(map(lambda x: x.as_location(), queryset))
        else:
            columns = ['ID',
            'Date de création',
            'Nom',
            'Nombre de déploiements',
            'Males',
            'Femelles',
            'Inconnus',
            'Latitude',
            'Longitude',
            'Altitude',
            'Habitat',
            'Description',
            'Référence',
            'Utilisateur']
            filename = 'sites'

            def get_row(site):
                sdict = site.as_dict()
                referenceText = "Non"
                if sdict["is_reference"]:
                    referenceText = "Oui"
                habitatText = "Inconnu"
                if sdict["habitat"]:
                    habitatText = site.get_habitat_display()

                catches_count_male = 0
                catches_count_female = 0
                catches_count_unknown = 0
                if site.catches_count > 0:
                    catches_count_male = site.catches_count_male
                    catches_count_female = site.catches_count_female
                    catches_count_unknown = site.catches_count_unknown

                return [
                            sdict.get("id"),
                            site.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                            sdict.get("name"),
                            site.catches_count,
                            catches_count_male,
                            catches_count_female,
                            catches_count_unknown,
                            sdict.get("latitude"),
                            sdict.get("longitude"),
                            sdict.get("altitude"),
                            habitatText,
                            sdict.get("description"),
                            referenceText,
                            sdict["username"],
                        ]
            if xlsx_format:
                filename = filename + '.xlsx'
                response = HttpResponse(
                    generate_xlsx('Sites', columns, queryset, get_row),
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
            if csv_format:
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(queryset, Echo(), columns, get_row)),
                    content_type='text/csv',
                )
                filename = filename + '.csv'
            response['Content-Disposition'] = 'attachment; filename=%s' % filename
            return response

    def retrieve(self, request, pk=None):
        site = get_object_or_404(Site, pk=pk)
        site_dict = site.as_dict()
        catches = Catch.objects.filter(site__id=pk).order_by('-collect_date')
        site_dict['catches_count'] = catches.count()
        site_dict['catches_count_male'] = catches.aggregate(Sum('male_count'))['male_count__sum']
        site_dict['catches_count_female'] = catches.aggregate(Sum('female_count'))['female_count__sum']
        site_dict['catches_count_unknown'] = catches.aggregate(Sum('unknown_count'))['unknown_count__sum']
        site_dict['catches'] = map(lambda x: x.as_dict(), catches)
        return Response(site_dict)

    def create(self, request):
        sites = request.data
        new_sites = []
        api_import = APIImport()
        api_import.user = request.user
        api_import.import_type = 'site'
        api_import.json_body = sites
        api_import.save()
        for site in sites:
            uuid = site.get('uuid', None)
            new_site, created = Site.objects.get_or_create(uuid=uuid)
            if created:
                new_site.name = site.get('name', None)
                new_site.habitat = site.get('habitat', None)
                new_site.accuracy = site.get('accuracy', None)
                new_site.description = site.get('description', None)
                t = site.get('time', None)
                if t:
                    new_site.created_at = timestamp_to_utc_datetime(int(t))
                else:
                    new_site.created_at = site.get('created_at', None)
                new_site.uuid = site.get('uuid', None)

                new_site.user = request.user
                new_site.source = 'API'
                new_site.api_import = api_import
                latitude = site.get('latitude', None)
                longitude = site.get('longitude', None)
                altitude = site.get('altitude', 0)
                if latitude and longitude:
                    new_site.location = Point(x=longitude, y=latitude, z=altitude, srid=4326)
                new_sites.append(new_site)
            new_site.save()

        return Response([site.as_dict() for site in new_sites])

    def update(self, request, pk=None):
        new_site = get_object_or_404(Site, pk=pk)
        new_site.name = request.data.get('name', '')
        new_site.description = request.data.get('description', '')
        new_site.habitat = request.data.get('habitat', 'unknown')
        new_site.is_reference = request.data.get('is_reference', False)
        new_site.ignore = request.data.get('ignore', False)
        new_site.save()
        return Response(new_site.as_dict())
