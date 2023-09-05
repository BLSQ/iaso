from beanstalk_worker import task_decorator
from iaso import models as m
from iaso.test import APITestCase


@task_decorator(task_name="org_unit_bulk_update")
def fake_empty_task():
    return 1000.0


class TaskLauncher(APITestCase):
    def setUp(self):
        self.task_test_account = m.Account.objects.create(name="Blue Adults")

        self.task_user = self.create_user_with_profile(
            username="test_task_user", account=self.task_test_account, permissions=[]
        )

    def test_with_wrong_username_should_fail(self):
        res = self.client.get("/tasks/launch_task/iaso.tests.test_task_launcher.fake_empty_task/test_wrong_user/")
        res_json = self.assertJSONResponse(res, 200)

        print(res_json)

        assert res_json["status"] == "fail"
        assert "User not found" in res_json["error"]

    def test_with_ok_username_wrong_taskname_should_fail(self):
        res = self.client.get("/tasks/launch_task/iaso.tests.test_XXX_launcher.fake_empty_task/test_task_user/")
        res_json = self.assertJSONResponse(res, 400)

        print(res_json)

        assert res_json["status"] == "fail"
        assert "Error while loading task" in res_json["error"]
        assert "No module named" in res_json["error_details"]

    def test_with_ok_username_ok_taskname_should_succeed(self):
        res = self.client.get("/tasks/launch_task/iaso.tests.test_task_launcher.fake_empty_task/test_task_user/")
        res_json = self.assertJSONResponse(res, 200)

        print(res_json)

        assert res_json["status"] == "success"
        assert res_json["task"]["id"] > 0
        assert res_json["task"]["params"]["module"] == "iaso.tests.test_task_launcher"
        assert res_json["task"]["params"]["method"] == "fake_empty_task"
        assert res_json["task"]["launcher"]["user_name"] == "test_task_user"

    def test_with_additional_get_params(self):
        res = self.client.get(
            "/tasks/launch_task/iaso.tests.test_task_launcher.fake_empty_task/test_task_user/?a=1&b=2"
        )
        res_json = self.assertJSONResponse(res, 200)

        print(res_json)

        assert res_json["status"] == "success"
        assert res_json["task"]["id"] > 0
        assert res_json["task"]["params"]["module"] == "iaso.tests.test_task_launcher"
        assert res_json["task"]["params"]["method"] == "fake_empty_task"
        assert res_json["task"]["launcher"]["user_name"] == "test_task_user"
        assert res_json["task"]["params"]["kwargs"]["a"][0] == "1"
        assert res_json["task"]["params"]["kwargs"]["b"][0] == "2"

    def test_with_additional_post_params(self):
        res = self.client.post(
            "/tasks/launch_task/iaso.tests.test_task_launcher.fake_empty_task/test_task_user/",
            data={"a": "1", "b": "2"},
        )

        res_json = self.assertJSONResponse(res, 200)

        assert res_json["status"] == "success"
        assert res_json["task"]["id"] > 0
        assert res_json["task"]["params"]["module"] == "iaso.tests.test_task_launcher"
        assert res_json["task"]["params"]["method"] == "fake_empty_task"
        assert res_json["task"]["launcher"]["user_name"] == "test_task_user"
        assert res_json["task"]["params"]["kwargs"]["a"][0] == "1"
        assert res_json["task"]["params"]["kwargs"]["b"][0] == "2"
