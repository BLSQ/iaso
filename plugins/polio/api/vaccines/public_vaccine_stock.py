import math

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from iaso.models import Group
from plugins.polio.models import VaccineStock


class PublicVaccineStockViewset(ViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    http_method_names = ["get"]

    def get_queryset(self, request):
        user = request.user
        app_id = request.query_params.get("app_id")
        return VaccineStock.objects.filter_for_user_and_app_id(user, app_id)

    def filter_queryset(self, request):
        queryset = self.get_queryset(request)

        country_block = request.query_params.get("country_block", None)
        country = request.query_params.get("country", None)
        vaccine = request.query_params.get("vaccine", None)

        if country_block:
            country_block = int(country_block)
            group = Group.objects.filter(id=country_block).first()
            if group.exists():
                queryset = queryset.filter(country__in=group.org_units)
        if country:
            queryset = queryset.filter(country__id=int(country))
        if vaccine:
            queryset = queryset.filter(vaccine=vaccine)
        return queryset

    # We filter separately because this filter can't be applied on the queryset level
    def filter_action_type(self, data_list, request):
        action_type = request.query_params.get("action_type", None)
        if action_type and "forma" not in action_type:
            data_list = [el for el in data_list if el["type"] == action_type]
        if action_type and action_type == "forma_used_vials":
            data_list = [el for el in data_list if "Form A - Vials Used" in el["action"]]
        if action_type and action_type == "forma_missing_vials":
            data_list = [el for el in data_list if "Form A - Missing Vials" in el["action"]]
        return data_list

    def sort_results(self, data_list, request):
        order = request.query_params.get("order", "date")
        reverse = order.startswith("-")
        if reverse:
            order = order[1:]
        return sorted(data_list, key=lambda x: x[order], reverse=reverse)

    def _get_json_data(self, request, usable):
        queryset = self.filter_queryset(request)
        all_entries = [stock.usable_vials() if usable else stock.unusable_vials() for stock in queryset]
        all_entries = sum(all_entries, [])
        return all_entries

    def _apply_filter_and_sort(self, json_data, request):
        filtered_data = self.filter_action_type(json_data, request)
        sorted_data = self.sort_results(filtered_data, request)
        return sorted_data

    def _compute_totals(self, json_data):
        total_vials = 0
        total_doses = 0
        for entry in json_data:
            if entry["vials_in"]:
                total_vials += entry["vials_in"]
            if entry["doses_in"]:
                total_doses += entry["doses_in"]
            if entry["vials_out"]:
                total_vials -= entry["vials_out"]
            if entry["doses_out"]:
                total_doses -= entry["doses_out"]

        return total_vials, total_doses

    def _paginate_response(self, request, json_data):
        total_vials, total_doses = self._compute_totals(json_data)
        # Adding some pagination to avoid crashing the front-end
        page = int(request.query_params.get("page", "1"))  # validate
        limit = int(request.query_params.get("limit", "20"))  # validate
        count = len(json_data)
        pages = math.ceil(count / limit)
        start_index = (page - 1) * limit
        end_index = (start_index) + (limit) if page < pages else None
        unusable_to_display = json_data[start_index:end_index]
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
    def get_unusable(self, request):
        all_unusable = self._get_json_data(request, usable=False)
        sorted_unusable = self._apply_filter_and_sort(all_unusable, request)

        return self._paginate_response(request, sorted_unusable)

    @action(
        detail=False,
        methods=["get"],
    )
    def get_usable(self, request):
        all_usable = self._get_json_data(request, usable=True)
        sorted_usable = self._apply_filter_and_sort(all_usable, request)

        return self._paginate_response(request, sorted_usable)

    def export_xlsx(self, request):
        # Data to export for usable based on queryparams received from front-end
        all_usable = self._get_json_data(request, usable=True)
        sorted_usable = self._apply_filter_and_sort(all_usable, request)

        # Data to export for unusable based on queryparams received from front-end
        all_unusable = self._get_json_data(request, usable=False)
        sorted_unusable = self._apply_filter_and_sort(all_unusable, request)
