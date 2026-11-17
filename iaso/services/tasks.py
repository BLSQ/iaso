from dataclasses import dataclass
from datetime import datetime
from logging import getLogger
from typing import Optional, Union

from django.utils import timezone
from django.utils.dateparse import parse_datetime


logger = getLogger(__name__)

FILE_PREFIX = "file:"


@dataclass(frozen=True)
class TaskResultFile:
    """A file produced by a task on S3, optionally only available until `expires_at`.

    It is stored in `Task.result["data"]` either as "file:<path>" when it does not expire,
    (legacy format) or as {"file": "<path>", "expires_at": "<date>"} when it does.
    """

    file: str
    expires_at: Optional[datetime] = None

    @property
    def expired(self) -> bool:
        return self.expires_at is not None and self.expires_at <= timezone.now()

    def to_json(self) -> Union[str, dict]:
        # For now, files that do not expire keep the original "file:..." format.
        if self.expires_at is None:
            return f"{FILE_PREFIX}{self.file}"
        return {"file": self.file, "expires_at": self.expires_at.isoformat()}

    @classmethod
    def from_json(cls, data) -> Optional["TaskResultFile"]:
        """Read the file from a task's result data, or return None if the task did not produce one."""
        if isinstance(data, str) and data.startswith(FILE_PREFIX):
            return cls(file=data.removeprefix(FILE_PREFIX))
        # External tasks write their result through the API, so the data may be malformed.
        if not (isinstance(data, dict) and isinstance(data.get("file"), str) and data["file"]):
            return None
        return cls(file=data["file"], expires_at=cls._parse_expires_at(data.get("expires_at")))

    @staticmethod
    def _parse_expires_at(raw_expires_at) -> Optional[datetime]:
        if not raw_expires_at:
            return None
        try:
            expires_at = parse_datetime(raw_expires_at) if isinstance(raw_expires_at, str) else None
        except ValueError:
            expires_at = None
        if expires_at is None:
            logger.warning(f"Invalid task result file expiry date: {raw_expires_at!r}")
            return None
        # External tasks may use "Z" or omit the offset, in which case the default timezone is assumed.
        return timezone.make_aware(expires_at) if timezone.is_naive(expires_at) else expires_at
