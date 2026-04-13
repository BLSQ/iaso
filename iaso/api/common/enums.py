import enum


class ChoiceEnum(enum.Enum):
    active = "active"
    all = "all"
    deleted = "deleted"


class FileFormatEnum(enum.Enum):
    CSV = "csv"
    XLSX = "xlsx"
