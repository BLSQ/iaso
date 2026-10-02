from django import forms
from django.contrib.admin.models import LogEntry
from django.contrib.auth.models import User
from django.utils import timezone

from beanstalk_worker.services import THROTTLE_CONFIG_SLUG
from iaso import models as m
from iaso.admin.task_throttles import parse_key_overrides
from iaso.models.json_config import Config
from iaso.test import TestCase


URL = "/admin/iaso/config/task-throttles/"


class TaskThrottlesAdminTestCase(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser("admin", "admin@example.com", "password")
        self.client.force_login(self.admin)

    def get_form(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, 200)
        return response.context["form"]

    def field_name(self, form, task_name, suffix, concurrency=None):
        t = [name for name, _ in form.throttled_tasks].index(task_name)
        if concurrency is None:
            return f"t{t}_{suffix}"
        names = [c.name for c in dict(form.throttled_tasks)[task_name].concurrency]
        return f"t{t}_c{names.index(concurrency)}_{suffix}"

    def post(self, form, changes):
        """Submit the form with its current values, updated by `changes`: {(task, concurrency, suffix): value}"""
        data = {}
        for name, field in form.fields.items():
            value = form[name].value()
            if isinstance(field, forms.BooleanField):
                if value:
                    data[name] = "on"
            else:
                data[name] = "" if value is None else value
        for (task_name, concurrency, suffix), value in changes.items():
            name = self.field_name(form, task_name, suffix, concurrency)
            if value is False:
                data.pop(name, None)
            else:
                data[name] = value
        return self.client.post(URL, data)

    def test_page_lists_the_throttled_tasks_and_their_usage(self):
        task = m.Task.objects.create(name="dummy_task", account=m.Account.objects.create(name="A"), status=m.RUNNING)
        m.TaskLease.objects.create(
            task=task, throttle_keys=["dummy_task:global", "dummy_task:account:7"], heartbeat_at=timezone.now()
        )

        response = self.client.get(URL)

        self.assertContains(response, "process_mobile_bulk_upload")
        self.assertContains(response, "dummy_task")
        section = next(s for s in response.context["sections"] if s["name"] == "dummy_task")
        self.assertEqual([limit["name"] for limit in section["limits"]], ["global", "account", "user"])
        self.assertEqual([limit["running"] for limit in section["limits"]], ["1", "7: 1", "0"])
        self.assertIn("import_gpkg_task", response.context["addable_tasks"])
        self.assertNotIn("dummy_task", response.context["addable_tasks"])

    def test_save(self):
        form = self.get_form()

        response = self.post(
            form,
            {
                ("dummy_task", "global", "mode"): "limit",
                ("dummy_task", "global", "limit"): "3",
                ("dummy_task", "account", "mode"): "unlimited",
                ("dummy_task", "account", "keys"): "42 = 4\n\n 17 = Unlimited ",
                ("dummy_task", None, "paused"): "on",
            },
        )

        self.assertRedirects(response, URL)
        config = Config.objects.get(slug=THROTTLE_CONFIG_SLUG)
        self.assertEqual(
            config.content,
            {"dummy_task": {"paused": True, "global": 3, "account": {"default": None, "keys": {"42": 4, "17": None}}}},
        )
        self.assertTrue(LogEntry.objects.filter(object_id=str(config.pk), user=self.admin).exists())

        # the saved values are shown back, and saving again without changes keeps them
        form = self.get_form()
        keys = form[self.field_name(form, "dummy_task", "keys", "account")].value()
        self.assertEqual(sorted(keys.splitlines()), ["17 = unlimited", "42 = 4"])  # jsonb doesn't keep the key order
        self.post(form, {})
        config.refresh_from_db()
        self.assertEqual(config.content["dummy_task"]["account"], {"default": None, "keys": {"42": 4, "17": None}})

    def test_throttle_a_task_without_throttle_in_its_code(self):
        response = self.client.get(f"{URL}?add=import_gpkg_task")
        form = response.context["form"]
        self.assertNotIn("import_gpkg_task", response.context["addable_tasks"])

        self.post(
            form,
            {
                ("import_gpkg_task", "global", "mode"): "limit",
                ("import_gpkg_task", "global", "limit"): "2",
                ("import_gpkg_task", "account", "mode"): "limit",
                ("import_gpkg_task", "account", "limit"): "1",
            },
        )

        content = Config.objects.get(slug=THROTTLE_CONFIG_SLUG).content
        self.assertEqual(content, {"import_gpkg_task": {"global": 2, "account": 1}})
        self.assertIn("import_gpkg_task", [s["name"] for s in self.client.get(URL).context["sections"]])

        # back to no limits: the task leaves the config and the page
        form = self.get_form()
        self.post(
            form,
            {("import_gpkg_task", "global", "mode"): "code", ("import_gpkg_task", "account", "mode"): "code"},
        )
        self.assertEqual(Config.objects.get(slug=THROTTLE_CONFIG_SLUG).content, {})
        self.assertIn("import_gpkg_task", self.client.get(URL).context["addable_tasks"])

    def test_adding_an_unknown_task_is_ignored(self):
        response = self.client.get(f"{URL}?add=not_a_task")

        self.assertNotIn("not_a_task", [s["name"] for s in response.context["sections"]])

    def test_back_to_the_code_defaults_removes_the_entry(self):
        Config.objects.create(slug=THROTTLE_CONFIG_SLUG, content={"dummy_task": {"global": 1}})

        self.post(self.get_form(), {("dummy_task", "global", "mode"): "code"})

        self.assertEqual(Config.objects.get(slug=THROTTLE_CONFIG_SLUG).content, {})

    def test_keeps_unknown_entries_and_replaces_invalid_values(self):
        Config.objects.create(
            slug=THROTTLE_CONFIG_SLUG,
            content={"removed_task": {"global": 1}, "dummy_task": {"global": "lots", "account": 2}},
        )
        form = self.get_form()
        self.assertEqual(form.invalid_values, ["dummy_task.global: 'lots'"])

        self.post(form, {})

        self.assertEqual(
            Config.objects.get(slug=THROTTLE_CONFIG_SLUG).content,
            {"removed_task": {"global": 1}, "dummy_task": {"account": 2}},
        )

    def test_invalid_input_is_not_saved(self):
        form = self.get_form()

        response = self.post(
            form,
            {
                ("dummy_task", "global", "mode"): "limit",
                ("dummy_task", "global", "limit"): "",
                ("dummy_task", "account", "keys"): "42 = 0",
            },
        )

        self.assertEqual(response.status_code, 200)
        errors = response.context["form"].errors
        self.assertEqual(errors[self.field_name(form, "dummy_task", "limit", "global")], ["Enter the limit."])
        self.assertIn("must be a number >= 1", errors[self.field_name(form, "dummy_task", "keys", "account")][0])
        self.assertFalse(Config.objects.filter(slug=THROTTLE_CONFIG_SLUG).exists())

    def test_concurrent_change_is_not_overwritten(self):
        config = Config.objects.create(slug=THROTTLE_CONFIG_SLUG, content={})
        form = self.get_form()
        config.content = {"dummy_task": {"global": 1}}
        config.save()  # someone else saved meanwhile

        response = self.post(form, {("dummy_task", "global", "mode"): "unlimited"})

        self.assertRedirects(response, URL)
        config.refresh_from_db()
        self.assertEqual(config.content, {"dummy_task": {"global": 1}})

    def test_requires_the_config_permissions(self):
        staff = User.objects.create_user("staff", password="password", is_staff=True)
        self.client.force_login(staff)

        self.assertEqual(self.client.get(URL).status_code, 403)

    def test_raw_json_is_read_only(self):
        config = Config.objects.create(slug=THROTTLE_CONFIG_SLUG, content={})

        response = self.client.get(f"/admin/iaso/config/{config.pk}/change/")

        self.assertContains(response, "Edit on the task throttles page")
        self.assertNotIn("content", response.context["adminform"].form.fields)


class ParseKeyOverridesTestCase(TestCase):
    def test_parse(self):
        self.assertEqual(parse_key_overrides("42 = 4\n\n17=unlimited\nx = null"), {"42": 4, "17": None, "x": None})

    def test_errors(self):
        for text in ("42", "= 4", "42 = ", "42 = -1", "42 = 1.5", "42 = 1\n42 = 2"):
            with self.subTest(text=text), self.assertRaises(forms.ValidationError):
                parse_key_overrides(text)
