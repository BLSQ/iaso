import importlib.util
import tempfile
import unittest
from pathlib import Path


def _load_merge_plugin_cron():
    path = Path(__file__).resolve().parent / "merge_plugin_cron.py"
    spec = importlib.util.spec_from_file_location("merge_plugin_cron", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


_merge_plugin_cron = _load_merge_plugin_cron()
merge_plugin_cron = _merge_plugin_cron.merge_plugin_cron
parse_cron_jobs = _merge_plugin_cron.parse_cron_jobs


ROOT = """version: 1
cron:
    - name: 'reap_lost_tasks'
      url: '/tasks/reap_lost_tasks/'
      schedule: '*/5 * * * *'
"""


class MergePluginCronTests(unittest.TestCase):
    def test_appends_enabled_plugin_jobs_once(self):
        with tempfile.TemporaryDirectory() as tmp:
            plugin = Path(tmp) / "polio"
            plugin.mkdir()
            (plugin / "cron.yaml").write_text(
                "version: 1\ncron:\n"
                "    - name: 'send_preparedness_weekly_email'\n"
                "      url: '/tasks/launch_task/plugins.polio.tasks.weekly_email.send_email/polio_cron_task_user/'\n"
                "      schedule: '0 1 * * 5'\n"
            )
            merged = merge_plugin_cron(ROOT, tmp, ["polio", "polio"])
            names = [job["name"] for job in parse_cron_jobs(merged)]
            self.assertEqual(names, ["reap_lost_tasks", "send_preparedness_weekly_email"])

    def test_skips_plugins_that_are_not_enabled(self):
        with tempfile.TemporaryDirectory() as tmp:
            plugin = Path(tmp) / "polio"
            plugin.mkdir()
            (plugin / "cron.yaml").write_text(
                "version: 1\ncron:\n    - name: 'send_preparedness_weekly_email'\n"
                "      url: '/tasks/x/'\n      schedule: '0 1 * * 5'\n"
            )
            merged = merge_plugin_cron(ROOT, tmp, ["wfp"])
            self.assertEqual([job["name"] for job in parse_cron_jobs(merged)], ["reap_lost_tasks"])


if __name__ == "__main__":
    unittest.main()
