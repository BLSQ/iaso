from django.core.paginator import Paginator
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.response import Response

from hat.common.utils import get_request_as_array
from hat.patient.models import Test
from hat.users.models import LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, get_authorized_geo
from hat.cases.models import (
    RES_POSITIVE,
    RES_UNREADABLE,
    RES_NEGATIVE,
    RES_MISSING,
    RES_ABSENT,
    RES_UNSURE,
    RES_INVALID,
)

from django.db.models import Q


class QCTestsViewSet(viewsets.ViewSet):
    """
    API to list tests, with images or video links if needed.

    list:
        parameters:
           limit: the limit on the number of tests
           type: the type of test (Ex: 'CATT', 'RDT', 'PG', ....)
           checked: if true, get tests that have already been checked, if false: get tests without check yet
           (only tests with images or videos allowing a check)
    """

    permission_required = ["menupermissions.x_qualitycontrol"]

    def list(self, request):
        user_level = request.user.profile.level
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        page_offset = int(request.GET.get("page", 1))
        limit = request.GET.get("limit", None)
        orders = request.GET.get("order", "date").split(",")
        test_types = request.GET.get("type", None)
        media_type = request.GET.get("media_type", '"image')
        user_ids = request.GET.get("user_ids", None)
        checked = request.GET.get("checked", False)
        province_ids = get_authorized_geo(
            request.user,
            "province",
            get_request_as_array(request.GET, "province_ids", None),
        )
        zs_ids = get_authorized_geo(
            request.user, "ZS", get_request_as_array(request.GET, "zs_ids", None)
        )
        as_ids = get_authorized_geo(
            request.user, "AS", get_request_as_array(request.GET, "as_ids", None)
        )

        qs = Test.objects.all()

        if from_date is not None:
            qs = qs.filter(date__date__gte=from_date)
        if to_date is not None:
            qs = qs.filter(date__date__lte=to_date)

        qs = qs.annotate(num_checks=Count("check"))

        if user_level == LEVEL_2:
            qs = qs.exclude(check__level=LEVEL_2)

        if user_level == LEVEL_3:
            qs = (
                qs.filter(check__level=LEVEL_2)
                .exclude(check__level=LEVEL_3)
                .filter(
                    (Q(check__result=RES_NEGATIVE) & Q(result__gte=RES_POSITIVE))
                    | (Q(check__result__gte=RES_POSITIVE) & Q(result=RES_NEGATIVE))
                )
            )

        if user_level == LEVEL_4 and checked:
            qs = qs.filter(check__level=LEVEL_3)
        else:
            qs = qs.exclude(check__level__gte=user_level)

        if test_types:
            qs = qs.filter(type__in=test_types.upper().split(","))
        if user_ids is not None:
            qs = qs.filter(tester__user_id__in=user_ids.split(","))
        if media_type == "image":
            qs = qs.exclude(image__isnull=True)
        if media_type == "video":
            qs = qs.exclude(video__isnull=True)
        if province_ids:
            if len(province_ids) == 0:
                return Response(
                    {"error": "not province allowed in this request for this user"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            qs = qs.filter(village__AS__ZS__province_id__in=province_ids)
        if zs_ids:
            if len(zs_ids) == 0:
                return Response(
                    {"error": "not ZS allowed in this request for this user"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            qs = qs.filter(village__AS__ZS_id__in=zs_ids)
        if as_ids:
            if len(as_ids) == 0:
                return Response(
                    {"error": "not AS allowed in this request for this user"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            qs = qs.filter(village__AS_id__in=as_ids)

        qs = qs.order_by(*orders)

        qs = qs.prefetch_related("form")
        qs = qs.prefetch_related("team")
        qs = qs.prefetch_related("village")
        qs = qs.prefetch_related("tester")
        qs = qs.prefetch_related("village__AS__ZS__province")
        limit = int(limit)
        paginator = Paginator(qs, limit)
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

    def retrieve(self, request, pk):
        # TODO check geographical limits
        test = get_object_or_404(Test, id=pk)
        res = test.as_dict(with_checks=True)
        if test.type == "CATT":
            other_catt = (
                Test.objects.filter(image=test.image)
                .exclude(id=test.id)
                .order_by("index")
            )
            res["other_catt"] = [test.as_dict() for test in other_catt]
        return Response(res)
