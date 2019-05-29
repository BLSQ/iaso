from django.contrib.gis.geos import Point
from django.core.paginator import Paginator
from django.db.models import OuterRef, Exists
from django.db.models import Q
from django.http import StreamingHttpResponse, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.geo.models import Province, ZS, AS
from hat.users.models import get_user_geo_list, is_authorized_user
from hat.vector_control.models import Target, APIImport
from .authentication import CsrfExemptSessionAuthentication
from .catches import timestamp_to_utc_datetime
from .export_utils import Echo, generate_xlsx, iter_items


class TargetsViewSet(viewsets.ViewSet):
    """
    API to allow retrieval of targets.

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
        orders = request.GET.get("order", "date_time").split(",")
        user_ids = request.GET.get("userId", None)
        province_ids = request.GET.get("province_id", None)
        zs_ids = request.GET.get("zs_id", None)
        as_ids = request.GET.get("as_id", None)
        queryset = Target.objects.all().order_by(*orders)
        filters = request.GET.get("targets_filter", False)

        if from_date is not None:
            queryset = queryset.filter(date_time__date__gte=from_date)
        if to_date is not None:
            queryset = queryset.filter(date_time__date__lte=to_date)
        if user_ids is not None:
            queryset = queryset.filter(Q(gps_import__user_id__in=user_ids.split(",")) | Q(api_import__user_id__in=user_ids.split(",")))

        if request.user.profile.province_scope.count() != 0:
            user_prov_subquery = Province.objects.filter(id__in=get_user_geo_list(request.user, 'province_scope')).distinct() \
                .filter(geom__contains=OuterRef("location"))
            queryset = queryset.annotate(in_user_prov=Exists(user_prov_subquery)).filter(in_user_prov=True)
        if request.user.profile.ZS_scope.count() != 0:
            user_zs_subquery = ZS.objects.filter(id__in=get_user_geo_list(request.user, 'ZS_scope')).distinct() \
                .filter(geom__contains=OuterRef("location"))
            queryset = queryset.annotate(in_user_zs=Exists(user_zs_subquery)).filter(in_user_zs=True)
        if request.user.profile.AS_scope.count() != 0:
            user_as_subquery = AS.objects.filter(id__in=get_user_geo_list(request.user, 'AS_scope')).distinct() \
                .filter(geom__contains=OuterRef("location"))
            queryset = queryset.annotate(in_user_as=Exists(user_as_subquery)).filter(in_user_as=True)

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

        if filters:
            if filters == "ignored":
                queryset = queryset.filter(ignore=True)
            if filters == "not_ignored":
                queryset = queryset.filter(ignore=False)

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
            if ((request.user.has_perm("menupermissions.x_anonymous") or not request.user.has_perm(
                    "menupermissions.x_datas_download")) and
                    not request.user.is_superuser):
                return Response('Unauthorized', status=401)
            columns = [{"title": 'ID', "width": 6},
                       {"title": 'Date', "width": 17},
                       {"title": 'Nom', "width": 15},
                       {"title": 'Latitude'},
                       {"title": 'Longitude'},
                       {"title": 'Altitude'},
                       {"title": 'Déploiement'},
                       {"title": 'Rivière', "width": 15}]
            filename = 'targets'

            def get_row(target, **kwargs):
                tdict = target.as_dict()
                return [
                            tdict.get("id"),
                            target.date_time.strftime("%Y-%m-%d %H:%M:%S"),
                            tdict.get("name"),
                            tdict.get("latitude"),
                            tdict.get("longitude"),
                            tdict.get("altitude"),
                            tdict.get("deployment"),
                            tdict.get("river"),
                        ]
            if xlsx_format:
                filename = filename + '.xlsx'
                response = HttpResponse(
                    generate_xlsx('Ecrans', columns, queryset, get_row),
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
            if csv_format:
                filename = filename + '.csv'
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(queryset, Echo(), columns, get_row)),
                    content_type='text/csv',
                )
            response['Content-Disposition'] = 'attachment; filename=%s' % filename
            return response

    def retrieve(self, request, pk=None):
        target = get_object_or_404(Target, pk=pk)
        province = Province.objects.filter(geom__contains=target.location)[0] if Province.objects.filter(geom__contains=target.location).count() > 0 else None
        zone = ZS.objects.filter(geom__contains=target.location)[0] if ZS.objects.filter(geom__contains=target.location).count() > 0 else None
        area = AS.objects.filter(geom__contains=target.location)[0] if AS.objects.filter(geom__contains=target.location).count() > 0 else None
        is_authorized = (province is None and zone is None and area is None) or ((province is not None and zone is not None and area is not None) and is_authorized_user(request.user, province.id, zone.id, area.id))
        if is_authorized:
            return Response(target.as_dict())
        else:
            return Response('Unauthorized', status=401)

    def update(self, request, pk=None):
        new_target = get_object_or_404(Target, pk=pk)

        province = Province.objects.filter(geom__contains=new_target.location).first()
        zone = ZS.objects.filter(geom__contains=new_target.location).first()
        area = AS.objects.filter(geom__contains=new_target.location).first()
        is_authorized = (province is None and zone is None and area is None) or ((province is not None and zone is not None and area is not None) and is_authorized_user(request.user, province.id, zone.id, area.id))
        if is_authorized:
            new_target.name = request.data.get('name', '')
            new_target.river = request.data.get('river', '')
            new_target.ignore = request.data.get('ignore', False)
            new_target.save()
            return Response(new_target.as_dict())

        else:
            return Response('Unauthorized', status=401)

    def create(self, request):
            targets = request.data

            new_targets = []
            api_import = APIImport()
            api_import.user = request.user
            api_import.import_type = 'targets'
            api_import.json_body = targets
            api_import.save()
            for target in targets:
                uuid = target.get('uuid', None)
                latitude = target.get('latitude', None)
                longitude = target.get('longitude', None)
                altitude = target.get('altitude', 0)

                target_location = None
                if latitude and longitude:
                    target_location = Point(x=longitude, y=latitude, z=altitude, srid=4326)
                new_target, created = Target.objects.get_or_create(uuid=uuid)
                if created:
                    new_target.village = target.get('village', None)
                    new_target.external_index = target.get('index', None)
                    new_target.accuracy = target.get('accuracy', None)

                    t = target.get('time', None)
                    if t:
                        new_target.date_time = timestamp_to_utc_datetime(int(t))

                    new_target.uuid = target.get('uuid', None)

                    new_target.user = request.user
                    new_target.source = 'API'
                    new_target.api_import = api_import
                    if target_location:
                        new_target.location = target_location

                    new_targets.append(new_target)
                    new_target.save()
                else:
                    print("not created")

            return Response([target.as_dict() for target in new_targets])



