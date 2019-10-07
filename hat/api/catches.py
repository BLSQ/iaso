from rest_framework import viewsets
from rest_framework.response import Response
from django.db.models import OuterRef, Exists
from django.shortcuts import get_object_or_404

from hat.api.export_utils import timestamp_to_utc_datetime
from hat.vector_control.models import Trap, Catch, APIImport
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.http import StreamingHttpResponse, HttpResponse
from django.contrib.gis.geos import Point
from django.db.models import Q
from django.core.paginator import Paginator

from hat.geo.models import Province, ZS, AS
from .export_utils import Echo, generate_xlsx, iter_items


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
            "trap_id": 18,
            "male_count": 10,
            "female_count": 50,
            "unknown_count": 50,
            "latitude": -2.75019127,
            "longitude": 19.68598159,
            ...
        },]



    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = ["menupermissions.x_vectorcontrol"]

    def list(self, request):
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        as_location = request.GET.get("as_location", False)
        province_ids = request.GET.get("province_id", None)
        zs_ids = request.GET.get("zs_id", None)
        as_ids = request.GET.get("as_id", None)
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        orders = request.GET.get("order", "collect_date,setup_date").split(",")
        # user_ids = request.GET.get("userId", None)
        problems = request.GET.get("problems", None)
        search_uuid = request.GET.get("search_uuid", None)
        queryset = Catch.objects.all()

        if search_uuid:
            queryset = queryset.filter(Q(uuid__icontains=search_uuid))

        if from_date is not None:
            queryset = queryset.filter(setup_date__date__gte=from_date)
        if to_date is not None:
            queryset = queryset.filter(setup_date__date__lte=to_date)
        queryset = queryset

        if problems is not None:
            queryset = queryset.filter(problem__in=problems.split(","))

        if province_ids:
            province_list = province_ids.split(",")
            prov_subquery = Province.objects.filter(id__in=province_list).filter(
                geom__contains=OuterRef("start_location")
            )
            queryset = queryset.annotate(in_prov=Exists(prov_subquery)).filter(
                in_prov=True
            )
        if zs_ids:
            zone_list = zs_ids.split(",")
            zs_subquery = ZS.objects.filter(id__in=zone_list).filter(
                geom__contains=OuterRef("start_location")
            )
            queryset = queryset.annotate(in_zs=Exists(zs_subquery)).filter(in_zs=True)
        if as_ids:
            area_list = as_ids.split(",")
            as_subquery = AS.objects.filter(id__in=area_list).filter(
                geom__contains=OuterRef("start_location")
            )
            queryset = queryset.annotate(in_as=Exists(as_subquery)).filter(in_as=True)

        queryset = queryset.order_by(*orders)
        queryset = queryset.prefetch_related("trap")

        if csv_format is None and xlsx_format is None:
            if as_location:
                return Response(map(lambda x: x.as_location(), queryset))

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
                {"title": "UUID", "width": 15},
                {"title": "Date de création", "width": 17},
                {"title": "Date de collecte", "width": 17},
                {"title": "Mâles", "width": 10},
                {"title": "Femelles", "width": 10},
                {"title": "Inconnus", "width": 10},
                {"title": "Source", "width": 8},
                {"title": "Latitude"},
                {"title": "Longitude"},
                {"title": "Altitude"},
                {"title": "Utilisateur"},
                {"title": "Remarques"},
                {"title": "Problème"},
            ]
            filename = "catches"

            def get_row(catch, **kwargs):
                cdict = catch.as_dict()
                return [
                    cdict.get("id"),
                    cdict.get("uuid"),
                    catch.setup_date.strftime("%Y-%m-%d %H:%M:%S"),
                    catch.collect_date.strftime("%Y-%m-%d %H:%M:%S"),
                    cdict.get("male_count"),
                    cdict.get("female_count"),
                    cdict.get("unknown_count"),
                    cdict.get("source"),
                    cdict.get("latitude"),
                    cdict.get("longitude"),
                    cdict.get("altitude"),
                    cdict.get("username"),
                    cdict.get("remarks"),
                    cdict.get("problem"),
                ]

            if xlsx_format:
                filename = filename + ".xlsx"
                response = HttpResponse(
                    generate_xlsx("Catches", columns, queryset, get_row),
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
        catch = get_object_or_404(Catch, pk=pk)

        return Response(catch.as_dict())

    def create(self, request):
        catches = request.data
        new_catches = []
        api_import = APIImport()
        api_import.user = request.user
        api_import.import_type = "catch"
        api_import.json_body = catches
        api_import.save()
        for catch in catches:
            uuid = catch.get("uuid", None)
            existing_catches = Catch.objects.filter(uuid=uuid)

            if existing_catches:
                new_catch = existing_catches[0]

            else:
                new_catch = Catch()
                new_catch.uuid = uuid
                trap_uuid = catch.get("trap_uuid", catch.get("site_uuid", None))
                trap, created = Trap.objects.get_or_create(uuid=trap_uuid)

                new_catch.trap = trap
                new_catch.api_import = api_import
                start_time = catch.get("startTime", None)
                if start_time:
                    new_catch.setup_date = timestamp_to_utc_datetime(int(start_time))
                start_latitude = catch.get("startLatitude", None)
                start_longitude = catch.get("startLongitude", None)
                start_altitude = catch.get("startAltitude", 0)
                new_catch.start_accuracy = catch.get("startAccuracy", None)
                new_catch.user = request.user

                if start_latitude and start_longitude:
                    new_catch.start_location = Point(
                        x=start_longitude, y=start_latitude, z=start_altitude, srid=4326
                    )

            end_time = catch.get("endTime", None)
            if end_time:
                new_catch.collect_date = timestamp_to_utc_datetime(int(end_time))

            new_catch.male_count = catch.get("maleCount", 0)
            new_catch.female_count = catch.get("femaleCount", 0)
            new_catch.unknown_count = catch.get("unknownCount", 0)
            new_catch.accuracy = catch.get("accuracy", None)
            new_catch.remarks = catch.get("remarks", "")

            end_latitude = catch.get("endLatitude", None)
            end_longitude = catch.get("endLongitude", None)
            end_altitude = catch.get("endAltitude", 0)
            new_catch.end_accuracy = catch.get("endAccuracy", None)
            new_catch.problem = catch.get("problem", None)
            if end_latitude and end_longitude:
                new_catch.end_location = Point(
                    x=end_longitude, y=end_latitude, z=end_altitude, srid=4326
                )

            new_catch.source = "API"
            new_catch.save()
            new_catches.append(new_catch)

        return Response([catch.as_dict() for catch in new_catches])
