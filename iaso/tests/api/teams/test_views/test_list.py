# todo
from iaso.test import APITestCase, SwaggerTestCaseMixin


class TeamListViewAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()

    def test_num_queries(self):
        pass

    def test_permissions(self):
        pass

    def test_filters(self):
        pass

    def test_should_not_see_teams_in_other_account(self):
        pass
