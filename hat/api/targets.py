import csv

from django.core.paginator import Paginator
from django.db.models import Q, OuterRef, Exists
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response
from django.contrib.auth.models import User

from hat.geo.models import Province, ZS, AS
from hat.vector_control.models import Target, GpsImport
from .authentication import CsrfExemptSessionAuthentication


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
        orders = request.GET.get("order", "date_time").split(",")
        user_ids = request.GET.get("userId", None)
        province_ids = request.GET.get("province_id", None)
        zs_ids = request.GET.get("zs_id", None)
        as_ids = request.GET.get("as_id", None)
        queryset = Target.objects.all().order_by(*orders)

        if from_date is not None:
            queryset = queryset.filter(date_time__date__gte=from_date)
        if to_date is not None:
            queryset = queryset.filter(date_time__date__lte=to_date)
        if user_ids is not None:
            queryset = queryset.filter(gps_import__user_id__in=user_ids.split(","))

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
                return Response(map(lambda x: x.as_location(), queryset))
        else:
            class Echo:
                """An object that implements just the write method of the file-like
                interface.
                """

                def write(self, value):
                    """Write the value by returning it, instead of storing in a buffer."""
                    return value

            def iter_items(queryset, pseudo_buffer):
                headers = ['ID', 'Date', 'Nom', 'Latitude', 'Longitude', 'Altitude', 'Deploiement', 'Rivière']
                writer = csv.writer(pseudo_buffer)
                yield writer.writerow(headers)
                for target in queryset.iterator(chunk_size=5000):
                    tdict = target.as_dict()
                    row = [
                        tdict.get("id"),
                        tdict.get("date_time"),
                        tdict.get("name"),
                        tdict.get("latitude"),
                        tdict.get("longitude"),
                        tdict.get("altitude"),
                        tdict.get("deployment"),
                        tdict.get("river"),
                    ]
                    yield writer.writerow(row)

            response = StreamingHttpResponse(
                streaming_content=(iter_items(queryset, Echo())),
                content_type='text/csv',
            )
            response['Content-Disposition'] = 'attachment;filename=targets.csv'
            return response

    def retrieve(self, request, pk=None):
        target = get_object_or_404(Target, pk=pk)

        return Response(target.as_dict())

    def update(self, request, pk=None):
        new_target = get_object_or_404(Target, pk=pk)
        new_target.name = request.data.get('name', '')
        new_target.river = request.data.get('river', '')
        new_target.ignore = request.data.get('ignore', False)
        username = request.data.get('username', None)
        if username:
            gps_import = get_object_or_404(GpsImport, pk=new_target.gps_import.id)
            gps_import.user = get_object_or_404(User, username=username)
            gps_import.save()
        new_target.save()
        return Response(new_target.as_dict())



