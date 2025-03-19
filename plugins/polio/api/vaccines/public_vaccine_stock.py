import math

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from plugins.polio.models import VaccineStock


class PublicVaccineStockViewset(ViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    http_method_names = ["get"]

    def get_queryset(self, request):
        user = request.user
        app_id = self.request.query_params.get("app_id")
        return VaccineStock.objects.filter_for_user_and_app_id(user, app_id)

    @action(
        detail=False,
        methods=["get"],
    )
    def get_unusable(self, request):
        queryset = self.get_queryset(request)
        all_unusable = [stock.unusable_vials() for stock in queryset]
        all_unusable = sum(all_unusable, [])
        all_unusable.sort(key=lambda x: x["date"])

        total_vials = 0
        total_doses = 0
        for entry in all_unusable:
            if entry["vials_in"]:
                total_vials += entry["vials_in"]
            if entry["doses_in"]:
                total_doses += entry["doses_in"]
            if entry["vials_out"]:
                total_vials -= entry["vials_out"]
            if entry["doses_out"]:
                total_doses -= entry["doses_out"]

        page = int(request.query_params.get("page", "1"))  # validate
        limit = int(request.query_params.get("limit", "20"))  # validate
        count = len(all_unusable)
        pages = math.ceil(count / limit)
        start_index = (page - 1) * limit
        end_index = (start_index) + (limit) if page < pages else None
        unusable_to_display = all_unusable[start_index:end_index]
        has_previous = page > 1
        has_next = page < pages
        data = {"total_vials": total_vials, "total_doses": total_doses, "movements": unusable_to_display}
        if page > pages:
            return Response({"result": f"Maximum page is {pages}, entered {page}"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "count": count,
                "results": data,
                "has_next": has_next,
                "has_previous": has_previous,
                "page": page,
                "pages": pages,
                "limit": limit,
            }
        )

    @action(
        detail=False,
        methods=["get"],
    )
    def get_usable(self, request):
        queryset = self.get_queryset(request)
        all_usable = [stock.usable_vials() for stock in queryset]
        all_usable = sum(all_usable, [])
        all_usable.sort(key=lambda x: x["date"])

        total_vials = 0
        total_doses = 0
        for entry in all_usable:
            if entry["vials_in"]:
                total_vials += entry["vials_in"]
            if entry["doses_in"]:
                total_doses += entry["doses_in"]
            if entry["vials_out"]:
                total_vials -= entry["vials_out"]
            if entry["doses_out"]:
                total_doses -= entry["doses_out"]

        page = int(request.query_params.get("page", "1"))  # validate
        limit = int(request.query_params.get("limit", "20"))  # validate
        count = len(all_usable)
        pages = math.ceil(count / limit)
        start_index = (page - 1) * limit
        end_index = (start_index) + (limit) if page < pages else None
        usable_to_display = all_usable[start_index:end_index]
        has_previous = page > 1
        has_next = page < pages
        data = {"total_vials": total_vials, "total_doses": total_doses, "movements": usable_to_display}
        if page > pages:
            return Response({"result": f"Maximum page is {pages}, entered {page}"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "count": count,
                "results": data,
                "has_next": has_next,
                "has_previous": has_previous,
                "page": page,
                "pages": pages,
                "limit": limit,
            }
        )
