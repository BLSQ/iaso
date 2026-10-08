from django.test import SimpleTestCase
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from iaso.api.promptness_stats.pagination import CountedDjangoPaginator, PromptnessStatsPagination


class UncountableList(list):
    """List whose `count()` must not be called: it stands for a queryset that is expensive to count"""

    def count(self, *args):
        raise AssertionError("count() must not be called")


class CountedDjangoPaginatorTestCase(SimpleTestCase):
    def test_uses_the_given_count(self):
        paginator = CountedDjangoPaginator(UncountableList(range(25)), per_page=10, count=25)
        self.assertEqual(paginator.count, 25)
        self.assertEqual(paginator.num_pages, 3)

    def test_given_count_is_trusted(self):
        # The given count is used as is, even if the list has another length
        paginator = CountedDjangoPaginator(UncountableList(range(25)), per_page=10, count=100)
        self.assertEqual(paginator.count, 100)
        self.assertEqual(paginator.num_pages, 10)

    def test_pages(self):
        paginator = CountedDjangoPaginator(UncountableList(range(25)), per_page=10, count=25)
        last_page = paginator.page(3)
        self.assertEqual(list(last_page.object_list), [20, 21, 22, 23, 24])
        self.assertFalse(last_page.has_next())
        self.assertTrue(last_page.has_previous())


class PromptnessStatsPaginationTestCase(SimpleTestCase):
    def get_request(self, params):
        return Request(APIRequestFactory().get("/", params))

    def test_paginate_with_count(self):
        pagination = PromptnessStatsPagination()
        page = pagination.paginate_queryset(
            UncountableList(range(25)), self.get_request({"page": 2, "limit": 10}), count=25
        )
        self.assertEqual(page, [10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
        self.assertEqual(pagination.page.paginator.count, 25)
        self.assertEqual(pagination.page.paginator.num_pages, 3)

    def test_paginate_without_count(self):
        # Without `count`, the paginated list is counted, like with the iaso `Paginator`
        pagination = PromptnessStatsPagination()
        page = pagination.paginate_queryset(list(range(25)), self.get_request({"page": 3, "limit": 10}))
        self.assertEqual(page, [20, 21, 22, 23, 24])
        self.assertEqual(pagination.page.paginator.count, 25)
