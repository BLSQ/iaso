from iaso.api.common import Paginator


class OrgUnitChangeRequestPagination(Paginator):
    page_size = 20


class ETLOrgUnitChangeRequestPagination(Paginator):
    page_size = 20
    max_page_size = 100
