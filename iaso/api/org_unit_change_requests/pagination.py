from iaso.api.common import Paginator
from iaso.models import OrgUnitChangeRequest


class MobileOrgUnitChangeRequestPagination(Paginator):
    page_size = 20


class OrgUnitChangeRequestPagination(Paginator):
    page_size = 20

    def get_paginated_output(self, data) -> dict:
        output = super().get_paginated_output(data)

        org_units_change_requests = self.page.paginator.object_list
        output["count_new"] = org_units_change_requests.filter(status=OrgUnitChangeRequest.Statuses.NEW).count()

        return output
