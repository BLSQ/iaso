from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Optional

from django.utils import timezone

from iaso.periods import Period


@dataclass(frozen=True)
class PromptnessPeriod:
    """Period window and deadline used to classify submissions.

    - `start` / `end`: first and last day of the period (as computed by `iaso.periods.Period`)
    - `deadline`: `end + grace_period_days`, inclusive
    - `is_current`: today is within [start, end]
    - `is_provisional`: today <= deadline (figures may still change)
    """

    value: str
    start: date
    end: date
    grace_period_days: int
    deadline: date
    is_current: bool
    is_provisional: bool

    @classmethod
    def build(cls, period_value: str, grace_period_days: int, today: Optional[date] = None) -> "PromptnessPeriod":
        """Build the period window from an iaso period string. `today` defaults to the current date."""
        if today is None:
            today = timezone.localdate()

        period = Period.from_string(period_value)
        start = period.start_date()
        # The last day of a period is the day before the first day of the next one
        end = period.next_period().start_date() - timedelta(days=1)
        deadline = end + timedelta(days=grace_period_days)

        return cls(
            value=period_value,
            start=start,
            end=end,
            grace_period_days=grace_period_days,
            deadline=deadline,
            is_current=start <= today <= end,
            is_provisional=today <= deadline,
        )

    @property
    def deadline_end(self) -> datetime:
        """First instant after the deadline day: a submission is on time if it was made strictly before it."""
        day_after_deadline = self.deadline + timedelta(days=1)
        return timezone.make_aware(datetime.combine(day_after_deadline, time.min))
