from collections.abc import Sequence
from typing import Optional

from django.utils.translation import gettext as _

from iaso.models import Task
from iaso.tasks.mobile_app_setup.api_calls import ApiCall, Page


class ExportProgress:
    """Tracks and reports the progress of the task."""

    def __init__(self, task: Task, api_calls: Sequence[ApiCall]):
        self.task = task
        self.end_value = 2 + sum(call.sub_steps for call in api_calls)
        # Where the share of the current API call starts on the progress bar.
        self._call_start = 2

    def start(self):
        """Set the initial status update and progress bar's length."""
        self._report(0, _("Starting"), end_value=self.end_value)

    def app_info_done(self):
        """Advance progress after first inital setup step, the app info (feature flags etc.) was fetched."""
        self._report(1)

    def authenticated(self):
        """Advance progress after second initial setup step: the client was authenticated."""
        self._report(2)

    def call_started(self, call: ApiCall):
        """Report which call is being fetched."""
        self._report(message=f"Fetching {call.filename}")

    def page_done(self, call: ApiCall, page: Page):
        """Move the progress bar for paginated responses in proportion to the value of `sub_steps`.

        Does nothing for calls that aren't paginated: `call_done` moves the progress bar.
        """
        if page.number is None:
            return
        # Capped, in case there are more pages than announced on the first one.
        value = self._call_start + min((page.number * call.sub_steps) // page.total_pages, call.sub_steps)
        self._report(value, f"Fetching {call.filename} (page {page.number}/{page.total_pages})")

    def call_done(self, call: ApiCall):
        """Report a call has been completed."""
        self._call_start += call.sub_steps
        self._report(self._call_start)

    def _report(self, value: Optional[int] = None, message: Optional[str] = None, end_value: Optional[int] = None):
        """Saves the progress on the task, and stops it if it was killed."""
        self.task.report_progress_and_stop_if_killed(
            progress_value=value, progress_message=message, end_value=end_value
        )
