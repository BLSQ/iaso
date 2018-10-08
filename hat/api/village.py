from django.db.models import Count
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.response import Response
from django.core.paginator import Paginator

from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from hat.geo.models import Village, AS
from hat.planning.models import Assignation, WorkZone, Coordination
from hat.audit.models import log_modification


class VillageViewSet(viewsets.ViewSet):
    """
    retrieve:
    Get all information about a given village
    If you add the request parameter planning_id, information about the assigned team for tha planning will be added
    Example:

    /api/villages/19450
    /api/villages/39978/?planning_id=2


    list:
    API allowing to list villages with their coordinates, and the corresponding number of confirmed cases (depending on the years parameter)
    Filterable on province_ids, zs_ids, as_ids, years and types. Possible types are
        'YES': Villages from Z.S.
        'NO': Villages not from Z.S.
        'OTHER': Locations where people are found during campaigns
        'NA': Villages from satellite (unknown)
    Default values are all empty, except for types, where the default values is "YES"
    You can also perform a search on the name of a village using the search parameter.

    examples:
    /api/villages/?zs_id=3
    /api/villages/?as_id=506
    /api/villages/?province_id=3
    /api/villages/?years=2017,2015,2016
    /api/villages/?types=YES,NA
    /api/villages/?search=bo&include_unlocated=true&as_list=true&limit=300
    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_plannings_microplanning',
        'menupermissions.x_locator',
        'menupermissions.x_vectorcontrol'
    ]

    def list(self, request):
        values = ("name", "id", "longitude", "latitude", "population", "AS_id", "AS__name", "village_official")
        province_ids = request.GET.get("province_id", None)
        zs_ids = request.GET.get("zs_id", None)
        as_ids = request.GET.get("as_id", None)
        coordination_id = request.GET.get("coordination_id", None)
        workzone_id = request.GET.get("workzone_id", None)
        years = request.GET.get("years", None)
        types = request.GET.get("types", "YES")
        as_list = request.GET.get("as_list", False)
        results = request.GET.get("results", "ALL")
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        search = request.GET.get("search", None)
        limit = request.GET.get("limit", None)
        page_offset = int(request.GET.get("page", None))
        orders = request.GET.get("order", "name").split(",")
        include_unlocated = request.GET.get("include_unlocated", None)
        only_unlocated = request.GET.get("only_unlocated", None)
        is_erased = request.GET.get("only_unlocated", False)

        queryset = Village.objects.all()

        if search:
            queryset = queryset.filter(name__icontains=search)
            values = values + ("AS__ZS__name", "AS__ZS__id", "AS__ZS__province__name", "AS__ZS__province__id")

        if province_ids:
            queryset = queryset.filter(AS__ZS__province_id__in=province_ids.split(","))
        if zs_ids:
            queryset = queryset.filter(AS__ZS_id__in=zs_ids.split(","))
        if as_ids:
            queryset = queryset.filter(AS_id__in=as_ids.split(","))

        if workzone_id:
            workzone = get_object_or_404(WorkZone, pk=workzone_id)
            queryset = queryset.filter(AS_id__in=workzone.AS.all())

        if coordination_id:
            coordination = get_object_or_404(Coordination, pk=coordination_id)
            queryset = queryset.filter(AS__ZS__id__in=coordination.ZS.all())

        if years:
            years_array = years.split(",")
            nr_positive_cases = Count(
                "caseview", filter=Q(caseview__confirmed_case=True, caseview__normalized_year__in=years_array)
            )
            queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
            values = values + ("nr_positive_cases",)
        else:
            if from_date is not None and to_date is not None:
                nr_positive_cases = Count(
                    "caseview",
                    filter=Q(caseview__confirmed_case=True, caseview__normalized_date__range=(from_date, to_date)),
                )
                queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
                values = values + ("nr_positive_cases",)

        if types:
            if types == 'all':
                types = 'YES,NO,OTHER,NA'
            types_array = types.split(",")
            queryset = queryset.filter(village_official__in=types_array)

        if results == "positive":
            queryset = queryset.filter(nr_positive_cases__gte=1)

        if results == "negative":
            queryset = queryset.filter(nr_positive_cases=0)

        if not include_unlocated:
            queryset = queryset.filter(latitude__isnull=False, longitude__isnull=False)

        if only_unlocated:
            queryset = queryset.filter(
                Q(latitude__isnull=True) | Q(longitude__isnull=True))

        if is_erased:
            queryset = queryset.filter(is_erased=is_erased)

        res = queryset.values(*values)

        if as_list:
            if page_offset:
                queryset = queryset.order_by(*orders)
                paginator = Paginator(queryset, limit)
                res = {"count": paginator.count}
                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)
                res["villages"] = map(lambda x: x.as_dict(), page.object_list)
                res["has_next"] = page.has_next()
                res["has_previous"] = page.has_previous()
                res["page"] = page_offset
                res["pages"] = paginator.num_pages
                res["limit"] = limit
                return Response(res)
            else :
                body = res.order_by(*orders)
                if limit:
                    body = body[: int(limit)]
        else:
            if limit:
                res = res[: int(limit)]
            body = {v["id"]: v for v in res}

        return Response(body)

    def retrieve(self, request, pk=None):
        village = get_object_or_404(Village, pk=pk)

        res = {
            "name": village.name,
            "province": village.AS.ZS.province.name,
            "former_province": village.AS.ZS.province.old_name,
            "zs": village.AS.ZS.name,
            "zs_id": village.AS.ZS.id,
            "as": village.AS.name,
            "as_id": village.AS.id,
            "type": village.village_official,
            "latitude": village.latitude,
            "longitude": village.longitude,
            "gps_source": village.gps_source,
            "population": village.population,
            "population_year": village.population_year,
            "population_source": village.population_source,
        }
        planning_id = request.GET.get("planning_id", None)
        if planning_id:
            assignations = Assignation.objects.filter(planning_id=planning_id, village=village)
            if assignations.exists():
                team = assignations[0].team
                res["team"] = {
                    "id": team.id,
                    "name": team.name,
                    "coordination": {"id": team.coordination_id, "name": team.coordination.name},
                }
            else:
                res["team"] = None
        return Response(res)

    def partial_update(self, request, pk=None):
        village = get_object_or_404(Village, id=pk)
        village.name = request.data.get('name', '')
        village.population = request.data.get('population', 0)
        village.population_source = request.data.get('population_source', '')
        village.population_year = request.data.get('population_year', 0)
        village.village_official = request.data.get('village_official', None)
        village.latitude = request.data.get('latitude', 0)
        village.longitude = request.data.get('longitude', 0)
        village.is_erased = request.data.get('is_erased', False)
        AS_id = request.data.get('AS_id', None)

        if AS_id:
            newAs = get_object_or_404(AS, pk=AS_id)
            village.AS = newAs

        village.save()
        return Response(village.as_dict())

    def create(self, request):
        name = request.data.get("name", None)
        population = request.data.get("population", 0)
        population_source = request.data.get("population_source", '')
        population_year = request.data.get("population_year", 0)
        village_official = request.data.get("village_official", None)
        AS_id = request.data.get('AS_id', None)
        latitude = request.data.get('latitude', 0)
        longitude = request.data.get('longitude', 0)


        village = Village()
        village.name = name
        village.population = population
        village.population_source = population_source
        village.population_year = population_year
        village.village_official = village_official
        village.latitude = latitude
        village.longitude = longitude
        if AS_id:
            newAs = get_object_or_404(AS, pk=AS_id)
            village.AS = newAs
        village.save()

        return Response(village.as_dict())

    def delete(self, request, pk):
        village = get_object_or_404(Village, id=pk)
        village.delete()
        return Response("ok")
