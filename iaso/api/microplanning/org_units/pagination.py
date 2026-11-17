from iaso.api.common import Paginator
from iaso.api.query_params import LIMIT, PAGE


class PlanningOrgUnitChildrenPagination(Paginator):
    page_size_query_param = LIMIT
    page_query_param = PAGE
    page_size = 50
    max_page_size = 500
