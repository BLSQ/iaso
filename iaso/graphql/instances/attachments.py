"""`submissionAttachments` / `submissionAttachment`: the files sent with a submission (`InstanceFile`: photos,
videos, documents...), ODK's "submission attachments". Those of the submissions `submissions` shows - deleted ones
included, as `submission(id:)` -, with the same read permissions. A list of its own, not a field of `Submission`: no
unbounded list below a list."""

from functools import reduce
from operator import or_
from typing import Any, Dict, List, Optional

from ariadne import ObjectType, QueryType
from django.db.models import F, Func, Q, QuerySet
from django.db.models.functions import Lower
from graphql import GraphQLResolveInfo

from iaso.models import InstanceFile

from ..common import (
    FilterMethod,
    SelectionTree,
    apply_filters,
    check_page,
    columns,
    ordering,
    orderings,
    page,
    selection_tree,
)
from .resolvers import visible_instances


MAX_LIMIT = 1_000

#: GraphQL field -> model column, for the fields read straight from a column
COLUMNS = {
    "id": "id",
    "name": "name",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
    "submissionId": "instance_id",
}
#: the fields read from the `file` column
FILE_FIELDS = ("url", "type")
ORDERINGS = orderings("id", "created_at")

#: `AttachmentType` -> extensions, those the web UI filters on; `OTHER` is none of them
EXTENSIONS = {
    "IMAGE": InstanceFile.IMAGE_EXTENSIONS,
    "VIDEO": InstanceFile.VIDEO_EXTENSIONS,
    "DOCUMENT": InstanceFile.DOCUMENT_EXTENSIONS,
}
ALL_EXTENSIONS = [extension for extensions in EXTENSIONS.values() for extension in extensions]

query = QueryType()
submission_attachment = ObjectType("SubmissionAttachment")


def visible_attachments(info: GraphQLResolveInfo) -> QuerySet:
    """Annotated with the lowercased `file_extension` of `type`. Not `objects_with_file_extensions`: its `LOWER` is
    lost to its `template`, a `.JPG` isn't an image there."""
    return InstanceFile.objects.filter(deleted=False, instance_id__in=visible_instances(info).values("id")).annotate(
        file_extension=Lower(Func(F("file"), template=r"SUBSTRING(%(expressions)s, '\.([^\.]+)$')"))
    )


def _of_type(attachment_type: str) -> Q:
    if attachment_type == "OTHER":
        # no extension at all is `NULL`: `NOT IN` alone would leave it out
        return ~Q(file_extension__in=ALL_EXTENSIONS) | Q(file_extension__isnull=True)
    return Q(file_extension__in=EXTENSIONS[attachment_type])


def _types(queryset: QuerySet, value, user) -> QuerySet:
    types: List[str] = value if isinstance(value, list) else [value]
    if not types:
        return queryset.none()  # as the other `...In` filters: `id__in=[]` matches nothing
    return queryset.filter(reduce(or_, (_of_type(attachment_type) for attachment_type in types)))


LOOKUPS = {
    "id": "id",
    "idIn": "id__in",
    "submissionId": "instance_id",
    "submissionIdIn": "instance_id__in",
    "formId": "instance__form_id",
    "orgUnitId": "instance__org_unit_id",
    "nameIContains": "name__icontains",
    "createdAtGte": "created_at__gte",
    "createdAtLte": "created_at__lte",
}
METHODS: Dict[str, FilterMethod] = {"type": _types, "typeIn": _types}


def load_selected(queryset: QuerySet, fields: SelectionTree) -> QuerySet:
    only = ["id", *columns(fields, COLUMNS)]
    if any(name in fields for name in FILE_FIELDS):
        only.append("file")
    return queryset.only(*only)


@query.field("submissionAttachments")
def resolve_submission_attachments(
    _, info: GraphQLResolveInfo, limit: int, offset: int, filters: Optional[Dict[str, Any]] = None, order=None
):
    selected = selection_tree(info)
    check_page(limit, offset, selected.get("items") or {}, MAX_LIMIT, {})
    queryset = apply_filters(visible_attachments(info), filters or {}, info.context["request"].user, LOOKUPS, METHODS)
    order_by = ordering(order, ORDERINGS, default="ID")
    return page(selected, queryset, load_selected, order_by, limit, offset)


@query.field("submissionAttachment")
def resolve_submission_attachment(_, info: GraphQLResolveInfo, id: int):
    return load_selected(visible_attachments(info), selection_tree(info)).filter(pk=id).order_by().first()


@submission_attachment.field("submissionId")
def resolve_submission_id(attachment, _info):
    return attachment.instance_id


@submission_attachment.field("url")
def resolve_url(attachment, _info):
    return attachment.file.url if attachment.file else None


@submission_attachment.field("type")
def resolve_type(attachment, _info):
    extension = attachment.file_extension
    return next((name for name, extensions in EXTENSIONS.items() if extension in extensions), "OTHER")
