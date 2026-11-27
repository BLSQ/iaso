from unittest import mock

from django.test import SimpleTestCase

from iaso.tasks.mobile_app_setup.api_calls import ApiCall, Page, Pagination
from iaso.tasks.mobile_app_setup.progress import ExportProgress


class ExportProgressTest(SimpleTestCase):
    def setUp(self):
        self.task = mock.Mock()
        self.calls = [
            ApiCall(path="/api/a/", filename="a"),
            ApiCall(path="/api/b/", filename="b", pagination=Pagination.PAGE, sub_steps=10),
        ]
        self.progress = ExportProgress(self.task, self.calls)

    def reported_values(self):
        return [c.kwargs["progress_value"] for c in self.task.report_progress_and_stop_if_killed.call_args_list]

    def test_end_value(self):
        self.progress.start()

        self.task.report_progress_and_stop_if_killed.assert_called_once_with(
            progress_value=0, progress_message="Starting", end_value=13
        )

    def test_pages_spread_the_call_progress(self):
        self.progress.call_done(self.calls[0])
        for number in [1, 2, 3]:
            self.progress.page_done(self.calls[1], Page(filename="b", payload={}, number=number, total_pages=3))
        self.progress.call_done(self.calls[1])

        self.assertEqual(self.reported_values(), [3, 6, 9, 13, 13])

    def test_progress_is_capped_when_there_are_more_pages_than_announced(self):
        self.progress.call_done(self.calls[0])
        self.progress.page_done(self.calls[1], Page(filename="b", payload={}, number=5, total_pages=2))

        self.assertEqual(self.reported_values(), [3, 13])
