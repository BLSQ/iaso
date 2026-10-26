from iaso.api.common import Paginator
from iaso.api.query_params import LIMIT, PAGE


SHAPE_RESULTS_MAX = 1000


class MobileOrgUnitsSetPagination(Paginator):
    page_size_query_param = LIMIT
    page_query_param = PAGE
    page_size = None  # None to disable pagination by default.

    def get_iaso_page_number(self, request):
        return int(request.query_params.get(self.page_query_param, 1))

    def get_page_size(self, request):
        page_size = super().get_page_size(request)
        if request.query_params.get("shapes", "false").lower() == "true":
            if page_size and page_size > SHAPE_RESULTS_MAX:
                return SHAPE_RESULTS_MAX

        return super().get_page_size(request)
