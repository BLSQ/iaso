from copy import copy

from django.core.paginator import Paginator
from django.db.models import Count
from django.db.models import Q
from django.db.models.expressions import RawSQL
from django.http import StreamingHttpResponse, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.audit.models import log_modification, VILLAGE_API
from hat.geo.models import Village, AS
from hat.planning.models import Assignation, WorkZone, Coordination
from hat.users.models import get_user_geo_list, is_authorized_user
from .authentication import CsrfExemptSessionAuthentication
from .export_utils import Echo, generate_xlsx, iter_items


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
        "menupermissions.x_plannings_microplanning",
        "menupermissions.x_locator",
        "menupermissions.x_vectorcontrol",
    ]

    def list(self, request):
        values = (
            "name",
            "id",
            "longitude",
            "latitude",
            "population",
            "AS_id",
            "AS__name",
            "village_official",
        )
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
        page_offset = request.GET.get("page", None)
        orders = request.GET.get("order", "name").split(",")
        include_unlocated = request.GET.get("include_unlocated", None)
        unlocated = request.GET.get("unlocated", None)
        population = request.GET.get("population", None)
        is_erased = request.GET.get("is_erased", False)
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        village_sources = request.GET.get("village_source", None)

        queryset = Village.objects.all()

        queryset = queryset.filter(is_erased=is_erased)

        if search:
            aliases_query = RawSQL("select count(*) from unnest(""geo_village"".aliases) it where it ilike %s",
                                   (f"%{search}%",))
            queryset = queryset.annotate(alias_match=aliases_query)
            queryset = queryset.filter(Q(name__icontains=search) | Q(alias_match__gt=0))
            values = values + (
                "AS__ZS__name",
                "AS__ZS__id",
                "AS__ZS__province__name",
                "AS__ZS__province__id",
            )

        if request.user.profile.province_scope.count() != 0:
            queryset = queryset.filter(
                AS__ZS__province_id__in=get_user_geo_list(
                    request.user, "province_scope"
                )
            ).distinct()
        if request.user.profile.ZS_scope.count() != 0:
            queryset = queryset.filter(
                AS__ZS_id__in=get_user_geo_list(request.user, "ZS_scope")
            ).distinct()
        if request.user.profile.AS_scope.count() != 0:
            queryset = queryset.filter(
                AS_id__in=get_user_geo_list(request.user, "AS_scope")
            ).distinct()

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

        if types:
            if types != "all":
                types_array = types.split(",")
                queryset = queryset.filter(village_official__in=types_array)

        if village_sources:
            village_source_array = village_sources.split(",")
            queryset = queryset.filter(village_source__in=village_source_array)

        if unlocated:
            if unlocated == "located":
                queryset = queryset.filter(
                    Q(latitude__isnull=False) & Q(longitude__isnull=False)
                )
            if unlocated == "unlocated":
                queryset = queryset.filter(
                    latitude__isnull=True, longitude__isnull=True
                )

        if not include_unlocated:
            queryset = queryset.filter(latitude__isnull=False, longitude__isnull=False)

        if population:
            if population == "populationOk":
                queryset = queryset.filter(Q(population__gt=0))
            if population == "populationNok":
                queryset = queryset.filter(Q(population=0) | Q(population__isnull=True))

        if years:
            years_array = years.split(",")
            nr_positive_cases = Count(
                "caseview",
                filter=Q(
                    caseview__confirmed_case=True,
                    caseview__normalized_year__in=years_array,
                ),
            )
            queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
            values = values + ("nr_positive_cases",)
        else:
            if from_date is not None and to_date is not None:
                nr_positive_cases = Count(
                    "caseview",
                    filter=Q(
                        caseview__confirmed_case=True,
                        caseview__normalized_date__range=(from_date, to_date),
                    ),
                )
                queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
                values = values + ("nr_positive_cases",)
            else:
                nr_positive_cases = Count(
                    "caseview", filter=Q(caseview__confirmed_case=True)
                )
                queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
                values = values + ("nr_positive_cases",)

        if results == "positive":
            queryset = queryset.filter(nr_positive_cases__gte=1)

        if results == "negative":
            queryset = queryset.filter(nr_positive_cases=0)

        res = queryset.values(*values)
        queryset = queryset.prefetch_related("AS")
        queryset = queryset.prefetch_related("AS__ZS")
        queryset = queryset.prefetch_related("AS__ZS__province")
        if as_list:
            if page_offset:
                page_offset = int(page_offset)
                queryset = queryset.order_by(*orders)
                values = values + (
                    "aliases",
                    "AS_id",
                    "AS__name",
                    "AS__ZS_id",
                    "AS__ZS__name",
                    "AS__ZS__province_id",
                    "AS__ZS__province__name",
                    "population_source",
                    "population_year",
                    "village_type",
                    "village_source",
                    "gps_source",
                    "is_erased",
                )
                paginator = Paginator(queryset.values(*values), limit)
                res = {"count": paginator.count}
                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)
                res["villages"] = page.object_list
                res["has_next"] = page.has_next()
                res["has_previous"] = page.has_previous()
                res["page"] = page_offset
                res["pages"] = paginator.num_pages
                res["limit"] = limit
            return Response(res)
        else:
            if csv_format or xlsx_format:
                if (
                    request.user.has_perm("menupermissions.x_anonymous")
                    or not request.user.has_perm("menupermissions.x_datas_download")
                ) and not request.user.is_superuser:
                    return Response("Unauthorized", status=401)
                filename = "villages"
                columns = [
                    {"title": "Identifiant"},
                    {"title": "Nom"},
                    {"title": "Population"},
                    {"title": "Cas positifs"},
                    {"title": "Province"},
                    {"title": "ZS"},
                    {"title": "AS"},
                    {"title": "Longitude"},
                    {"title": "Latitude"},
                    {"title": "Officiel"},
                    {"title": "Source"},
                    {"title": "Source Gps"},
                ]

                def get_row(village, **kwargs):
                    return [
                        village.id,
                        village.name,
                        village.population,
                        village.nr_positive_cases,
                        village.AS.ZS.province.name,
                        village.AS.ZS.name,
                        village.AS.name,
                        village.longitude,
                        village.latitude,
                        village.village_type,
                        village.village_source,
                        village.gps_source,
                    ]

                if xlsx_format:
                    filename = filename + ".xlsx"
                    response = HttpResponse(
                        generate_xlsx("Villages", columns, queryset, get_row),
                        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    )
                if csv_format:
                    filename = filename + ".csv"
                    response = StreamingHttpResponse(
                        streaming_content=(
                            iter_items(queryset, Echo(), columns, get_row)
                        ),
                        content_type="text/csv",
                    )

                response["Content-Disposition"] = "attachment; filename=%s" % filename
                response["Cache-Control"] = "no-cache, no-store, must-revalidate"
                return response
            else:
                if limit:
                    res = res[: int(limit)]
                body = {v["id"]: v for v in res}
                return Response(body)

    def retrieve(self, request, pk=None):
        village = get_object_or_404(Village, pk=pk)
        is_authorized = is_authorized_user(
            request.user, village.AS.ZS.province.id, village.AS.ZS.id, village.AS.id
        )
        if is_authorized:
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
                assignations = Assignation.objects.filter(
                    planning_id=planning_id, village=village
                )
                if assignations.exists():
                    team = assignations[0].team
                    res["team"] = {
                        "id": team.id,
                        "name": team.name,
                        "coordination": {
                            "id": team.coordination_id,
                            "name": team.coordination.name,
                        },
                    }
                else:
                    res["team"] = None
            return Response(res)
        else:
            return Response("Unauthorized", status=401)

    def partial_update(self, request, pk=None):
        village = get_object_or_404(Village, id=pk)
        is_authorized = is_authorized_user(
            request.user, village.AS.ZS.province.id, village.AS.ZS.id, village.AS.id
        )
        if is_authorized:
            original_village = copy(village)
            village.name = request.data.get("name", "")
            village.population = request.data.get("population", 0)
            village.population_source = request.data.get("population_source", "")
            village.population_year = request.data.get("population_year", 0)
            village.village_official = request.data.get("village_official", None)
            village.latitude = request.data.get("latitude", 0)
            village.longitude = request.data.get("longitude", 0)
            village.is_erased = request.data.get("is_erased", False)
            village.village_type = request.data.get("village_type", "")
            village.village_source = request.data.get("village_source", None)
            village.gps_source = request.data.get("gps_source", "")
            village.aliases = request.data.get("aliases", "")
            AS_id = request.data.get("AS_id", None)

            if AS_id:
                newAs = get_object_or_404(AS, pk=AS_id)
                village.AS = newAs

            village.save()
            log_modification(original_village, village, VILLAGE_API, request.user)
            return Response(village.as_dict())
        else:
            return Response("Unauthorized", status=401)

    def create(self, request):
        name = request.data.get("name", None)
        population = request.data.get("population", 0)
        population_source = request.data.get("population_source", "")
        population_year = request.data.get("population_year", 0)
        village_official = request.data.get("village_official", None)
        AS_id = request.data.get("AS_id", None)
        latitude = request.data.get("latitude", 0)
        longitude = request.data.get("longitude", 0)
        village_type = request.data.get("village_type", "")
        village_source = request.data.get("village_source", None)
        gps_source = request.data.get("gps_source", "")
        aliases = request.data.get("aliases", "{}")

        village = Village()
        village.name = name
        village.population = population
        village.population_source = population_source
        village.population_year = population_year
        village.village_official = village_official
        village.latitude = latitude
        village.longitude = longitude
        village.village_type = village_type
        village.village_source = village_source
        village.gps_source = gps_source
        village.aliases = aliases
        is_authorized = True
        if AS_id:
            newAs = get_object_or_404(AS, pk=AS_id)
            is_authorized = is_authorized_user(
                request.user, newAs.ZS.province.id, newAs.ZS.id, newAs.id
            )
            village.AS = newAs
        if is_authorized:
            village.save()
            log_modification(None, village, VILLAGE_API, request.user)
            return Response(village.as_dict())
        else:
            return Response("Unauthorized", status=401)
