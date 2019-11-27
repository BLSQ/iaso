import json

from iaso.management.commands.command_logger import CommandLogger


class ShapelyJsonEncoder(json.JSONEncoder):
    def __init__(self, **kwargs):
        super(ShapelyJsonEncoder, self).__init__(**kwargs)

    def default(self, obj):
        if hasattr(obj, "as_dict"):
            return obj.as_dict()
        return obj.wkt


class Dumper:
    def __init__(self, logger):
        self.iaso_logger = logger

    def dump(self, diffs, fields):
        print(json.dumps(diffs, indent=4, cls=ShapelyJsonEncoder))

        display = []
        header = ["dhis2Id", "name", "ou status"]
        for field in fields:
            if field.startswith("groupset:"):
                header.append(field.split(":")[2])
            else:
                header.append(field)

        display.append(header)
        for diff in diffs:
            results = [diff.org_unit.source_ref, diff.org_unit.name, diff.status]

            for field in fields:
                comparison = list(filter(lambda x: x.field == field, diff.comparisons))[
                    0
                ]
                results.append(comparison.status)

            display.append(results)

        def color(status):
            if status == "modified":
                return CommandLogger.RED
            if status == "same":
                return CommandLogger.END
            if status == "new":
                return CommandLogger.GREEN
            return CommandLogger.END

        for d in display:
            message = "\t".join(
                map(
                    lambda s: self.iaso_logger.colorize(
                        str(s).ljust(20, " "), color(s)
                    ),
                    d,
                )
            )
            if d[2] == "new":
                self.iaso_logger.info(
                    self.iaso_logger.colorize(message, CommandLogger.GREEN)
                )
            elif d[2] == "modified":
                self.iaso_logger.info(
                    self.iaso_logger.colorize(message, CommandLogger.RED)
                )
            else:
                self.iaso_logger.info(message)
