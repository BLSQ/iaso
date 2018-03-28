from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404
from hat.planning.models import Planning, Assignation
from hat.geo.models import Village
from django.db.models import Q
from django.db.models import Count


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

    examples:
    /api/villages/?zs_id=3
    /api/villages/?as_id=506
    /api/villages/?province_id=3
    /api/villages/?years=2017,2015,2016
    /api/villages/?types=YES,NA
    """

    def list(self, request):
        values = ('name', 'id', 'longitude', 'latitude', 'population', 'AS_id', 'AS__name', 'village_official')
        province_ids = request.GET.get("province_id", None)
        zs_ids = request.GET.get("zs_id", None)
        as_ids = request.GET.get("as_id", None)
        years = request.GET.get("years", None)
        types = request.GET.get("types", "YES")
        as_list = request.GET.get("as_list", False)
        results = request.GET.get("results", "ALL")
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)

        queryset = Village.objects.all()

        if province_ids:
            queryset = queryset.filter(AS__ZS__province_id__in=province_ids.split(','))
        if zs_ids:
            queryset = queryset.filter(AS__ZS_id__in=zs_ids.split(','))
        if as_ids:
            queryset = queryset.filter(AS_id__in=as_ids.split(','))

        if years:
            years_array = years.split(",")
            nr_positive_cases = Count('case', filter=Q(case__confirmed_case=True,
                                                       case__form_year__in=years_array)

                                      )
            queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
            values = values + ('nr_positive_cases', )
        else:
            if from_date is not None and to_date is not None:
                nr_positive_cases = Count('case', filter=Q(case__confirmed_case=True,
                                                        case__document_date__range=(from_date, to_date))

                                        )
                queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
                values = values + ('nr_positive_cases', )

        if types:
            types_array = types.split(",")
            queryset = queryset.filter(village_official__in=types_array)

        if results == 'positive':
            queryset = queryset.filter(nr_positive_cases__gte=1)

        if results == 'negative':
            queryset = queryset.filter(nr_positive_cases=0)

        res = queryset.values(*values)

        if as_list:
            body = res.order_by('name')
        else:
            body = {v["id"]: v for v in res}

        return Response(body)

    def retrieve(self, request, pk=None):
        village = get_object_or_404(Village, pk=pk)

        res = {
            'name': village.name,
            'province': village.AS.ZS.province.name,
            'former_province': village.AS.ZS.province.old_name,
            'zs': village.AS.ZS.name,
            'zs_id': village.AS.ZS.id,
            'as': village.AS.name,
            'as_id': village.AS.id,
            'type': village.village_official,
            'latitude': village.latitude,
            'longitude': village.longitude,
            'gps_source': village.gps_source,
            'population': village.population,
            'population_year': village.population_year,
            'population_source': village.population_source,
        }
        planning_id = request.GET.get("planning_id", None)
        if planning_id:
            assignations = Assignation.objects.filter(planning_id=planning_id, village=village)
            if assignations.exists():
                team = assignations[0].team
                res["team"] = {
                    "id": team.id,
                    "name": team.name,
                    "coordination": {
                        "id": team.coordination_id,
                        "name": team.coordination.name
                    }
                }
            else:
                res["team"] = None
        return Response(res)