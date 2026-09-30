from dataclasses import dataclass
from datetime import date
from typing import Optional


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
        raise NotImplementedError
