from dataclasses import dataclass
from enum import Enum


class NotificationType(Enum):
    APIIMPORT = "APIIMPORT"


class NotificationLevel(Enum):
    NOTICE = "NOTICE"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


@dataclass
class Notification:
    message: str
    level: NotificationLevel
    type: NotificationType
