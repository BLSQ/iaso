import operator
from functools import reduce

from django.contrib.gis.geos import Point
from django.core.paginator import Paginator
from django.db.models import OuterRef, Exists, Count, Sum
from django.http import StreamingHttpResponse, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response
from django.db.models import Q

from hat.geo.models import Province, ZS, AS
from hat.users.models import get_user_geo_list, is_authorized_user
from hat.vector_control.models import Trap, APIImport, Catch, Site
from .authentication import CsrfExemptSessionAuthentication
from .catches import timestamp_to_utc_datetime
from .export_utils import Echo, generate_xlsx, iter_items


class TrapsViewSet(viewsets.ViewSet):
    """
    Team API to allow create and retrieval of traps.

    list:
    Returns the list of existing traps

    retrieve:
    returns a given trap information
    example: /api/traps/2/

    create:
    To insert an array of traps, send a POST to this URL
    Example: PUT on /api/traps/ with JSON body
    [{
        "id":"2",
        "count": 10,
        "total": 100

    }]

    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    permission_required = ["menupermissions.x_vectorcontrol"]

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
        filters = request.GET.get("traps_filter", False)
        province_ids = request.GET.get("province_id", None)
        zs_ids = request.GET.get("zs_id", None)
        as_ids = request.GET.get("as_id", None)
        search_uuid = request.GET.get("search_uuid", None)
        as_location = request.GET.get("as_location", False)

        queryset = Trap.objects.all()

        if search_uuid:
            queryset = queryset.filter(Q(uuid__icontains=search_uuid))

        if from_date is not None or to_date is not None:
            catch_subquery = Catch.objects.filter(trap_id=OuterRef("id"))
            trap_conditions = []
            if from_date is not None:
                catch_subquery = catch_subquery.filter(setup_date__date__gte=from_date)
                trap_conditions.append(Q(created_at__date__gte=from_date))
            if to_date is not None:
                catch_subquery = catch_subquery.filter(setup_date__date__lte=to_date)
                trap_conditions.append(Q(created_at__date__lte=to_date))

            queryset = queryset.annotate(catch_in_date_range=Exists(catch_subquery))
            queryset = queryset.filter(
                (reduce(operator.and_, trap_conditions) | Q(catch_in_date_range=True))
            )

        if user_ids is not None:
            queryset = queryset.filter(user_id__in=user_ids.split(","))
        if habitats is not None:
            queryset = queryset.filter(habitat__in=habitats.split(","))
        if filters:
            if filters == "selected":
                queryset = queryset.filter(is_selected=True)
            if filters == "not_selected":
                queryset = queryset.filter(is_selected=False)
            if filters == "ignored":
                queryset = queryset.filter(ignore=True)
            if filters == "not_ignored":
                queryset = queryset.filter(ignore=False)

        if request.user.profile.province_scope.count() != 0:
            user_prov_subquery = (
                Province.objects.filter(
                    id__in=get_user_geo_list(request.user, "province_scope")
                )
                .distinct()
                .filter(geom__contains=OuterRef("location"))
            )
            queryset = queryset.annotate(
                in_user_prov=Exists(user_prov_subquery)
            ).filter(in_user_prov=True)
        if request.user.profile.ZS_scope.count() != 0:
            user_zs_subquery = (
                ZS.objects.filter(id__in=get_user_geo_list(request.user, "ZS_scope"))
                .distinct()
                .filter(geom__contains=OuterRef("location"))
            )
            queryset = queryset.annotate(in_user_zs=Exists(user_zs_subquery)).filter(
                in_user_zs=True
            )
        if request.user.profile.AS_scope.count() != 0:
            user_as_subquery = (
                AS.objects.filter(id__in=get_user_geo_list(request.user, "AS_scope"))
                .distinct()
                .filter(geom__contains=OuterRef("location"))
            )
            queryset = queryset.annotate(in_user_as=Exists(user_as_subquery)).filter(
                in_user_as=True
            )

        if province_ids:
            province_list = province_ids.split(",")
            prov_subquery = Province.objects.filter(id__in=province_list).filter(
                geom__contains=OuterRef("location")
            )
            queryset = queryset.annotate(in_prov=Exists(prov_subquery)).filter(
                in_prov=True
            )
        if zs_ids:
            zone_list = zs_ids.split(",")
            zs_subquery = ZS.objects.filter(id__in=zone_list).filter(
                geom__contains=OuterRef("location")
            )
            queryset = queryset.annotate(in_zs=Exists(zs_subquery)).filter(in_zs=True)
        if as_ids:
            area_list = as_ids.split(",")
            as_subquery = AS.objects.filter(id__in=area_list).filter(
                geom__contains=OuterRef("location")
            )
            queryset = queryset.annotate(in_as=Exists(as_subquery)).filter(in_as=True)

        additional_fields = [
            "catches_count",
            "catches_count_male",
            "catches_count_female",
            "catches_count_unknown",
            "catches_count_total",
        ]
        queryset = queryset.annotate(catches_count=Count("catch"))
        queryset = queryset.annotate(catches_count_male=Sum("catch__male_count"))
        queryset = queryset.annotate(catches_count_female=Sum("catch__female_count"))
        queryset = queryset.annotate(catches_count_unknown=Sum("catch__unknown_count"))
        queryset = queryset.annotate(
            catches_count_total=Sum("catch__unknown_count")
            + Sum("catch__male_count")
            + Sum("catch__female_count")
        )
        queryset = queryset.order_by(*orders)
        queryset = queryset.prefetch_related("catch_set")

        if csv_format is None and xlsx_format is None:
            if limit:
                limit = int(limit)
                page_offset = int(page_offset)

                paginator = Paginator(queryset, limit)
                res = {"count": paginator.count}
                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)

                res["list"] = map(
                    lambda x: x.as_dict(additional_fields), page.object_list
                )
                res["has_next"] = page.has_next()
                res["has_previous"] = page.has_previous()
                res["page"] = page_offset
                res["pages"] = paginator.num_pages
                res["limit"] = limit
                return Response(res)
            else:
                if as_location:
                    return Response(map(lambda x: x.as_location(), queryset))
                else:
                    return Response(map(lambda x: x.as_dict(), queryset))
        else:
            if (
                request.user.has_perm("menupermissions.x_anonymous")
                or not request.user.has_perm("menupermissions.x_datas_download")
            ) and not request.user.is_superuser:
                return Response("Unauthorized", status=401)
            columns = [
                {"title": "ID", "width": 5},
                {"title": "Uid", "width": 10},
                {"title": "Date de création", "width": 17},
                {"title": "Date de modification", "width": 17},
                {"title": "Nom", "width": 15},
                {"title": "Nombre de\ndéploiements", "width": 10},
                {"title": "Males"},
                {"title": "Femelles"},
                {"title": "Inconnus"},
                {"title": "Total"},
                {"title": "Latitude"},
                {"title": "Longitude"},
                {"title": "Altitude"},
                {"title": "Habitat"},
                {"title": "Description"},
                {"title": "Sélectionné"},
                {"title": "Ignoré"},
                {"title": "Utilisateur"},
                {"title": "Source"},
                {"title": "Rivière"},
                {"title": "Site", "width": 30},
            ]
            filename = "traps"

            def get_row(trap, **kwargs):
                sdict = trap.as_dict(additional_fields)
                selectedText = "Non"
                if sdict["is_selected"]:
                    selectedText = "Oui"
                habitatText = "Inconnu"
                if sdict["habitat"]:
                    habitatText = trap.get_habitat_display()

                catches_count_male = 0
                catches_count_female = 0
                catches_count_unknown = 0
                if trap.catches_count > 0:
                    catches_count_male = trap.catches_count_male
                    catches_count_female = trap.catches_count_female
                    catches_count_unknown = trap.catches_count_unknown
                return [
                    sdict.get("id"),
                    sdict.get("uuid"),
                    trap.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    trap.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
                    sdict.get("name"),
                    trap.catches_count,
                    catches_count_male,
                    catches_count_female,
                    catches_count_unknown,
                    sdict.get("total"),
                    sdict.get("latitude"),
                    sdict.get("longitude"),
                    sdict.get("altitude"),
                    habitatText,
                    sdict.get("description"),
                    selectedText,
                    "Oui" if sdict["ignore"] else "Non",
                    sdict.get("username"),
                    sdict.get("source"),
                    sdict.get("river"),
                    sdict.get("site").get("uuid") if sdict.get("site") else "Inconnu",
                ]

            if xlsx_format:
                filename = filename + ".xlsx"
                response = HttpResponse(
                    generate_xlsx("Pièges", columns, queryset, get_row),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            if csv_format:
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(queryset, Echo(), columns, get_row)),
                    content_type="text/csv",
                )
                filename = filename + ".csv"
            response["Content-Disposition"] = "attachment; filename=%s" % filename
            return response

    def retrieve(self, request, pk=None):
        trap = get_object_or_404(Trap, pk=pk)
        province = (
            Province.objects.filter(geom__contains=trap.location).first()
            if Province.objects.filter(geom__contains=trap.location).count() > 0
            else None
        )
        zone = (
            ZS.objects.filter(geom__contains=trap.location).first()
            if ZS.objects.filter(geom__contains=trap.location).count() > 0
            else None
        )
        area = (
            AS.objects.filter(geom__contains=trap.location).first()
            if AS.objects.filter(geom__contains=trap.location).count() > 0
            else None
        )
        is_authorized = (
            province is None and zone is None and area is None
        ) or is_authorized_user(request.user, province, zone, area)

        if is_authorized:
            trap_dict = trap.as_dict()
            catches = Catch.objects.filter(trap__id=pk).order_by("-collect_date")
            trap_dict["catches_count"] = catches.count()
            trap_dict["catches_count_male"] = catches.aggregate(Sum("male_count"))[
                "male_count__sum"
            ]

            trap_dict["catches_count_female"] = catches.aggregate(Sum("female_count"))[
                "female_count__sum"
            ]
            trap_dict["catches_count_unknown"] = catches.aggregate(
                Sum("unknown_count")
            )["unknown_count__sum"]
            trap_dict["catches"] = map(lambda x: x.as_dict(), catches)
            return Response(trap_dict)
        else:
            return Response("Unauthorized", status=401)

    def create(self, request):
        traps = request.data

        new_traps = []
        api_import = APIImport()
        api_import.user = request.user
        api_import.import_type = "trap"
        api_import.json_body = traps
        api_import.save()
        for trap in traps:
            uuid = trap.get("uuid", None)
            latitude = trap.get("latitude", None)
            longitude = trap.get("longitude", None)
            altitude = trap.get("altitude", 0)
            trap_location = None
            if latitude and longitude:
                trap_location = Point(x=longitude, y=latitude, z=altitude, srid=4326)
            new_trap, created = Trap.objects.get_or_create(uuid=uuid)
            if created:
                site = Site.objects.filter(uuid=trap.get("site_uuid", None)).first()
                new_trap.site = site
                new_trap.name = trap.get("name", None)
                new_trap.river = trap.get("river", None)
                new_trap.habitat = trap.get("habitat", None)
                new_trap.accuracy = trap.get("accuracy", None)
                new_trap.description = trap.get("description", None)
                t = trap.get("time", None)
                if t:
                    new_trap.created_at = timestamp_to_utc_datetime(int(t))
                else:
                    new_trap.created_at = trap.get("created_at", None)
                new_trap.uuid = trap.get("uuid", None)

                new_trap.user = request.user
                new_trap.source = "API"
                new_trap.api_import = api_import
                if trap_location:
                    new_trap.location = trap_location
                new_traps.append(new_trap)
                new_trap.save()

        return Response([trap.as_location() for trap in new_traps])

    def update(self, request, pk=None):
        new_trap = get_object_or_404(Trap, pk=pk)
        province = (
            Province.objects.filter(geom__contains=new_trap.location).first()
            if Province.objects.filter(geom__contains=new_trap.location).count() > 0
            else None
        )
        zone = (
            ZS.objects.filter(geom__contains=new_trap.location).first()
            if ZS.objects.filter(geom__contains=new_trap.location).count() > 0
            else None
        )
        area = (
            AS.objects.filter(geom__contains=new_trap.location).first()
            if AS.objects.filter(geom__contains=new_trap.location).count() > 0
            else None
        )
        is_authorized = (
            province is None and zone is None and area is None
        ) or is_authorized_user(request.user, province, zone, area)

        if is_authorized:
            new_trap.name = request.data.get("name", "")
            new_trap.description = request.data.get("description", "")
            new_trap.habitat = request.data.get("habitat", "unknown")
            new_trap.is_selected = request.data.get("is_selected", False)
            new_trap.ignore = request.data.get("ignore", False)
            new_trap.is_selected = request.data.get("is_selected", False)
            new_trap.save()
            return Response(new_trap.as_dict())
        else:
            return Response("Unauthorized", status=401)
