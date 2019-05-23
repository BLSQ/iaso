from django.contrib.gis.geos import Point
from django.core.paginator import Paginator
from django.db.models import OuterRef, Exists, Count
from django.http import StreamingHttpResponse, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response
from django.db.models import Q

from hat.geo.models import Province, ZS, AS
from hat.users.models import get_user_geo_list, is_authorized_user, Profile
from hat.vector_control.models import Site, APIImport, Trap, Catch
from .authentication import CsrfExemptSessionAuthentication
from .catches import timestamp_to_utc_datetime
from .export_utils import Echo, generate_xlsx, iter_items


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
        province_ids = request.GET.get("province_id", None)
        zs_ids = request.GET.get("zs_id", None)
        as_ids = request.GET.get("as_id", None)
        responsible = request.GET.get("responsible", False)
        queryset = Site.objects.all()

        if from_date is not None:
            trap_subquery = Trap.objects.filter(created_at__date__gte=from_date)
            sitesTraps = [trap.site.id for trap in trap_subquery]
            catch_subquery = Catch.objects.filter(setup_date__date__gte=from_date)
            sitesCatchs = [catch.trap.site.id for catch in catch_subquery]
            queryset = queryset.filter(
                Q(created_at__date__gte=from_date)
                | Q(id__in=sitesTraps)
                | Q(id__in=sitesCatchs)
            )
        if to_date is not None:
            trap_subquery = Trap.objects.filter(created_at__date__lte=to_date)
            sitesTraps = [trap.site.id for trap in trap_subquery]
            catch_subquery = Catch.objects.filter(setup_date__date__lte=to_date)
            sitesCatchs = [catch.trap.site.id for catch in catch_subquery]
            queryset = queryset.filter(
                Q(created_at__date__lte=to_date)
                | Q(id__in=sitesTraps)
                | Q(id__in=sitesCatchs)
            )

        if user_ids is not None:
            queryset = queryset.filter(creator_id__in=user_ids.split(","))

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

        if responsible:
            queryset = queryset.filter(responsible=request.user)

        additional_fields = ["traps_count"]
        queryset = queryset.annotate(traps_count=Count("trap"))
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
                return Response(map(lambda x: x.as_dict(additional_fields), queryset))
        else:
            if ((request.user.has_perm("menupermissions.x_anonymous") or not request.user.has_perm(
                    "menupermissions.x_datas_download")) and
                    not request.user.is_superuser):
                return Response('Unauthorized', status=401)
            columns = [
                {"title": "ID", "width": 5},
                {"title": "Date de création", "width": 17},
                {"title": "Nom", "width": 15},
                {"title": "Latitude"},
                {"title": "Longitude"},
                {"title": "Altitude"},
                {"title": "Description"},
                {"title": "Responsable"},
                {"title": "Nombre de pièges"},
            ]
            filename = "sites"

            def get_row(site, **kwargs):
                sdict = site.as_dict(additional_fields)
                return [
                    sdict.get("id"),
                    site.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    sdict.get("name"),
                    sdict.get("latitude"),
                    sdict.get("longitude"),
                    sdict.get("altitude"),
                    sdict.get("description"),
                    sdict["responsible"],
                    site.traps_count,
                ]

            if xlsx_format:
                filename = filename + ".xlsx"
                response = HttpResponse(
                    generate_xlsx("Sites", columns, queryset, get_row),
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
        site = get_object_or_404(Site, pk=pk)
        province = (
            Province.objects.filter(geom__contains=site.location).first()
            if Province.objects.filter(geom__contains=site.location).count() > 0
            else None
        )
        zone = (
            ZS.objects.filter(geom__contains=site.location).first()
            if ZS.objects.filter(geom__contains=site.location).count() > 0
            else None
        )
        area = (
            AS.objects.filter(geom__contains=site.location).first()
            if AS.objects.filter(geom__contains=site.location).count() > 0
            else None
        )
        is_authorized = (province is None and zone is None and area is None) or (
            (province is not None and zone is not None and area is not None)
            and is_authorized_user(request.user, province.id, zone.id, area.id)
        )

        if is_authorized:
            site_dict = site.as_dict()
            traps = Trap.objects.filter(site__id=pk).order_by("-updated_at")
            site_dict["traps"] = map(lambda x: x.as_dict(), traps)
            return Response(site_dict)
        else:
            return Response("Unauthorized", status=401)

    def create(self, request):
        sites = request.data

        new_sites = []
        api_import = APIImport()
        api_import.user = request.user
        api_import.import_type = "site"
        api_import.json_body = sites
        api_import.save()
        for site in sites:
            uuid = site.get("uuid", None)
            latitude = site.get("latitude", None)
            longitude = site.get("longitude", None)
            altitude = site.get("altitude", 0)
            site_location = None

            if latitude and longitude:
                site_location = Point(x=longitude, y=latitude, z=altitude, srid=4326)
            new_site, created = Site.objects.get_or_create(uuid=uuid)

            if created:
                new_site.name = site.get("name", None)
                new_site.habitat = site.get("habitat", None)
                new_site.accuracy = site.get("accuracy", None)
                new_site.description = site.get("description", None)
                t = site.get("time", None)
                if t:
                    new_site.created_at = timestamp_to_utc_datetime(int(t))
                else:
                    new_site.created_at = site.get("created_at", None)
                new_site.uuid = site.get("uuid", None)

                new_site.creator = request.user
                new_site.source = "API"
                new_site.api_import = api_import
                if site_location:
                    new_site.location = site_location

                new_sites.append(new_site)
                print("created", new_site)
            else:
                print("not created")
            new_site.save()

        return Response([site.as_dict() for site in new_sites])

    def update(self, request, pk=None):
        new_site = get_object_or_404(Site, pk=pk)
        province = (
            Province.objects.filter(geom__contains=new_site.location).first()
            if Province.objects.filter(geom__contains=new_site.location).count() > 0
            else None
        )
        zone = (
            ZS.objects.filter(geom__contains=new_site.location).first()
            if ZS.objects.filter(geom__contains=new_site.location).count() > 0
            else None
        )
        area = (
            AS.objects.filter(geom__contains=new_site.location).first()
            if AS.objects.filter(geom__contains=new_site.location).count() > 0
            else None
        )
        is_authorized = (province is None and zone is None and area is None) or (
            (province is not None and zone is not None and area is not None)
            and is_authorized_user(request.user, province.id, zone.id, area.id)
        )

        if is_authorized:
            profile_id = request.data.get("responsible_id", None)
            if profile_id:
                profile = get_object_or_404(Profile, pk=profile_id)
                new_site.responsible = profile.user
            new_site.name = request.data.get("name", "")
            new_site.description = request.data.get("description", "")
            new_site.ignore = request.data.get("ignore", False)

            new_site.save()
            return Response(new_site.as_dict())
        else:
            return Response("Unauthorized", status=401)
