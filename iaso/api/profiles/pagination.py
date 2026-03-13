from rest_framework.pagination import _positive_int

from iaso.api.common import Paginator


class ProfilePagination(Paginator):
    page_size = 20


class ProfileDropdownPagination(ProfilePagination):
    """
    Just a paginator that does not enable the pagination by default
    """

    def get_page_size(self, request):
        if self.page_size_query_param:
            try:
                return _positive_int(
                    request.query_params[self.page_size_query_param], strict=True, cutoff=self.max_page_size
                )
            except (KeyError, ValueError):
                pass

        return None
