import logging
from copy import copy
from functools import reduce

from django.core.paginator import Paginator
from django.db import connection
from django.db.models import Count
from django.db.models import Q
from django.db.models.expressions import RawSQL
from django.http import StreamingHttpResponse, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.audit.models import log_modification, VILLAGE_API
from hat.cases.models import Case
from hat.geo.models import Village, AS
from hat.planning.models import Assignation, WorkZone, Coordination
from hat.users.models import get_user_geo_list, is_authorized_user
from .authentication import CsrfExemptSessionAuthentication
from .export_utils import Echo, generate_xlsx, iter_items
from ..patient.models import Test, Patient

logger = logging.getLogger(__name__)


def years_filter(years):
    year_filters = []
    range_year = None
    start_year_range = None
    for year in sorted(years):
        if not range_year:
            start_year_range = f"{year}-01-01"
            range_year = year
        elif int(range_year) == int(year) - 1:
            range_year = year
        else:
            year_filters.append(
                Q(infection_cases__document_date__gte=start_year_range)
                & Q(infection_cases__document_date__lte=f"{range_year}-12-31")
            )
            start_year_range = f"{year}-01-01"
            range_year = year
    year_filters.append(
        Q(infection_cases__document_date__gte=start_year_range)
        & Q(infection_cases__document_date__lte=f"{range_year}-12-31")
    )
    return reduce(lambda x, y: x | y, year_filters)


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
        include_merged = request.GET.get("include_merged", "False") == "True"
        unlocated = request.GET.get("unlocated", None)
        population = request.GET.get("population", None)
        is_erased = request.GET.get("is_erased", False)
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        village_sources = request.GET.get("village_source", None)

        queryset = Village.objects.all()

        queryset = queryset.filter(is_erased=is_erased)

        if search:
            aliases_query = RawSQL(
                "select count(*) from unnest("
                "geo_village"
                ".aliases) it where it ilike %s",
                (f"%{search}%",),
            )
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

        if not include_merged:
            queryset = queryset.filter(merged_to__isnull=True)

        if population:
            if population == "populationOk":
                queryset = queryset.filter(Q(population__gt=0))
            if population == "populationNok":
                queryset = queryset.filter(Q(population=0) | Q(population__isnull=True))

        if years:
            years_array = years.split(",")
            nr_positive_cases = Count(
                "infection_cases",
                filter=Q(infection_cases__confirmed_case=True)
                & years_filter(years_array),
            )
            queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
            values = values + ("nr_positive_cases",)
            for year in years_array:
                nr_positive_cases_year = Count(
                    "infection_cases",
                    filter=Q(
                        infection_cases__confirmed_case=True,
                        infection_cases__document_date__year=year,
                    ),
                )
                queryset = queryset.annotate(
                    **{f"nr_positive_cases_{year}": nr_positive_cases_year}
                )
                values = values + (f"nr_positive_cases_{year}",)
        else:
            years_array = None
            if from_date is not None and to_date is not None:
                nr_positive_cases = Count(
                    "case",
                    filter=Q(
                        case__confirmed_case=True,
                        case__document_date__year__range=(from_date, to_date),
                    ),
                )
                queryset = queryset.annotate(nr_positive_cases=nr_positive_cases)
                values = values + ("nr_positive_cases",)
            else:
                nr_positive_cases = Count("case", filter=Q(case__confirmed_case=True))
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
                    "merged_to",
                    "merged_to__name",
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
                    {"title": "Nom", "width": 15},
                    {"title": "Population"},
                    {"title": "Cas positifs"},
                    {"title": "Province"},
                    {"title": "ZS", "width": 15},
                    {"title": "AS", "width": 15},
                    {"title": "Longitude"},
                    {"title": "Latitude"},
                    {"title": "Officiel"},
                    {"title": "Source"},
                    {"title": "Source Gps", "width": 12},
                ]
                if years_array:
                    for year in years_array:
                        columns.append({"title": f"Cas positifs\n{year}", "width": 10})

                def get_row(village, years=None, **kwargs):
                    row = [
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
                    if years:
                        for year in years:
                            row.append(getattr(village, f"nr_positive_cases_{year}"))
                    return row

                if xlsx_format:
                    filename = filename + ".xlsx"
                    response = HttpResponse(
                        generate_xlsx(
                            "Villages",
                            columns,
                            queryset,
                            lambda row, **kwargs: get_row(row, years_array),
                        ),
                        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    )
                if csv_format:
                    filename = filename + ".csv"
                    response = StreamingHttpResponse(
                        streaming_content=(
                            iter_items(
                                queryset,
                                Echo(),
                                columns,
                                lambda row, **kwargs: get_row(row, years_array),
                            )
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
                "merged_to": village.merged_to_id,
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
            if "name" in request.data:
                village.name = request.data.get("name", "")
            if "population" in request.data:
                village.population = request.data.get("population", 0)
            if "population_source" in request.data:
                village.population_source = request.data.get("population_source", "")
            if "population_year" in request.data:
                village.population_year = request.data.get("population_year", 0)
            if "village_official" in request.data:
                village.village_official = request.data.get("village_official", None)
            if "latitude" in request.data:
                village.latitude = request.data.get("latitude", 0)
            if "longitude" in request.data:
                village.longitude = request.data.get("longitude", 0)
            if "is_erased" in request.data:
                village.is_erased = request.data.get("is_erased", False)
            if "village_type" in request.data:
                village.village_type = request.data.get("village_type", "")
            if "village_source" in request.data:
                village.village_source = request.data.get("village_source", None)
            if "gps_source" in request.data:
                village.gps_source = request.data.get("gps_source", "")
            if "aliases" in request.data:
                village.aliases = request.data.get("aliases", "")
            if "AS_id" in request.data:
                as_id = request.data.get("AS_id", None)
                if as_id:
                    new_as = get_object_or_404(AS, pk=as_id)
                    village.AS = new_as
            if (
                "merged_to" in request.data
                and request.data.get("merged_to", None) is not None
            ):
                merged_to_id = request.data.get("merged_to", None)
                logger.info("Merging Village %s into %s", pk, merged_to_id)
                merged_to = get_object_or_404(Village, pk=merged_to_id)
                if merged_to.id == pk:
                    return Response(
                        "You can't merge a village into itself",
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # TODO move this to a service
                # Merging the village into another one.
                # 1 This has several steps: update existing data to the new village
                # 2 Update existing villages to merge into the new one
                # 3 Set the merged_to on this village
                cases_updated = Case.objects.filter(normalized_village=pk).update(
                    normalized_village=merged_to
                )
                tests_updated = Test.objects.filter(village=pk).update(
                    village=merged_to
                )
                patients_updated = Patient.objects.filter(origin_village=pk).update(
                    origin_village=merged_to
                )
                assignations_deleted = 0
                assignations_updated = 0
                for assignation in Assignation.objects.filter(village=pk):
                    if (
                        Assignation.objects.filter(planning=assignation.planning)
                        .filter(team=assignation.team)
                        .filter(village=merged_to)
                        .filter(month=assignation.month)
                        .exists()
                    ):
                        assignation.delete()
                        assignations_deleted += 1
                    else:
                        assignation.village = merged_to
                        assignation.save()
                        assignations_updated += 1

                # Update the PTR to the merged_to village
                updated_pop_nb = village.populationdata_set.update(
                    village_id=merged_to_id
                )
                if updated_pop_nb:
                    latest_pop_data = merged_to.populationdata_set.order_by(
                        "-report_date"
                    ).first()
                    if latest_pop_data:
                        merged_to.population_source = latest_pop_data.source
                        merged_to.population_year = latest_pop_data.population_year
                        merged_to.population = latest_pop_data.population
                        merged_to.save()

                villages_updated = Village.objects.filter(merged_to=pk).update(
                    merged_to=merged_to
                )
                village.merged_to = merged_to
                logger.info(
                    "Merged successfully %s into %s, updated cases %s, tests %s, patients %s, villages %s,"
                    " assignations deleted %s, updated %s, population records %s",
                    pk,
                    merged_to_id,
                    cases_updated,
                    tests_updated,
                    patients_updated,
                    villages_updated,
                    assignations_deleted,
                    assignations_updated,
                    updated_pop_nb,
                )
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
