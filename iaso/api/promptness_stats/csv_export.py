import codecs
import csv

from typing import Iterator

from django.db.models import QuerySet
from rest_framework import serializers


class Echo:
    """File-like object whose `write()` returns the line instead of storing it: `csv` writers then produce the lines
    one by one, to be streamed."""

    def write(self, value: str) -> str:
        return value


def stream_csv(
    rows: QuerySet, row_serializer: serializers.Serializer, columns: list[str], chunk_size: int = 2000
) -> Iterator[str]:
    """Lines of the CSV, header first.

    `rows` are fetched by chunks from the database, and serialized one by one with `row_serializer.to_representation()`:
    nothing is accumulated in memory. The keys of a serialized row that are not in `columns` are ignored.

    The CSV starts with a UTF-8 BOM: without it, Excel doesn't detect the encoding, and garbles the non-ASCII characters
    of the names.
    """
    writer = csv.DictWriter(Echo(), fieldnames=columns, extrasaction="ignore")
    yield codecs.BOM_UTF8.decode("utf-8")
    yield writer.writeheader()
    for row in rows.iterator(chunk_size=chunk_size):
        yield writer.writerow(row_serializer.to_representation(row))
