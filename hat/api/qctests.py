from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.response import Response

from hat.sync.models import ImageUpload
from hat.patient.models import Test
from hat.constants import TYPES_WITH_IMAGES, TYPES_WITH_VIDEOS
from hat.users.models import LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5
from django.core.paginator import Paginator


class QCTestsViewSet(viewsets.ViewSet):
    """
    API to list tests, with images or video links if needed.

    list:
        parameters:
           limit: the limit on the number of tests
           type: the type of test (Ex: 'CATT', 'RDT', 'PG', ....)
           checked: if true, get tests that have already been checked, if false: get tests without check yet (only tests with images or videos allowing a check)
    """

    permission_required = ["menupermissions.x_qualitycontrol"]

    def list(self, request):
        user_level = request.user.profile.level
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        checked = request.GET.get("checked", None)
        page_offset = int(request.GET.get("page", 1))
        limit = request.GET.get("limit", None)
        orders = request.GET.get("order", "date").split(",")
        test_types = request.GET.get("type", None)
        media_type = request.GET.get("media_type", '"image')
        user_ids = request.GET.get("user_ids", None)
        province_ids = request.GET.get("province_ids", None)
        zs_ids = request.GET.get("zs_ids", None)
        as_ids = request.GET.get("as_ids", None)

        qs = Test.objects.all()

        if from_date is not None:
            qs = qs.filter(date__date__gte=from_date)
        if to_date is not None:
            qs = qs.filter(date__date__lte=to_date)
        if checked is not None:
            qs = qs.annotate(num_checks=Count("check"))
            if checked != "true":
                if user_level == LEVEL_1:
                    qs = qs.exclude(num_checks__gt=0)
                else:
                    if user_level > LEVEL_1:
                        target_level = LEVEL_1
                        if user_level == LEVEL_3:
                            target_level = LEVEL_2
                        elif user_level == LEVEL_4:
                            target_level == LEVEL_3
                        elif user_level == LEVEL_5:
                            target_level == LEVEL_4
                        qs = qs.filter(check__level=target_level).exclude(
                            check__level__gt=target_level
                        )
            else:
                qs = qs.filter(num_checks__gt=0)
        if test_types:
            qs = qs.filter(type__in=test_types.upper().split(","))
        if user_ids is not None:
            qs = qs.filter(tester__user_id__in=user_ids.split(","))
        if media_type == "image":
            qs = qs.exclude(image=None)
        if media_type == "video":
            qs = qs.exclude(video=None)
        if province_ids:
            qs = qs.filter(village__AS__ZS__province_id__in=province_ids.split(","))
        if zs_ids:
            qs = qs.filter(village__AS__ZS_id__in=zs_ids.split(","))
        if as_ids:
            qs = qs.filter(village__AS_id__in=as_ids.split(","))

        qs = qs.order_by(*orders)
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
        test = get_object_or_404(Test, id=pk)
        res = test.as_dict(with_checks=True)
        if test.type == "CATT":
            other_catt = Test.objects.filter(image=test.image).exclude(id=test.id).order_by("index")
            res["other_catt"] = [test.as_dict() for test in other_catt]
        return Response(res)
