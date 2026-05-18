from iaso.api.common import Paginator


class ETLInstancePagination(Paginator):
    page_size = 20
    max_page_size = 100
