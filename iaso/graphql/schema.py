"""Schema-first: the types are the `.graphql` files (`common.graphql`, then one `schema.graphql` per model
package); Python binds the root resolvers, the fields that aren't a plain attribute, and the scalars. Every other
field reads its `snake_case` attribute (`sourceRef` -> `org_unit.source_ref`), from the model instances or the dicts
the resolvers return."""

from datetime import date, datetime, timedelta
from pathlib import Path

from ariadne import (
    ScalarType,
    convert_camel_case_to_snake,
    load_schema_from_path,
    make_executable_schema,
    upload_scalar,
)
from django.utils import timezone
from graphql import GraphQLError, GraphQLObjectType, GraphQLSchema

from .errors import input_error
from .forms.mutations import mutation as forms_mutation
from .forms.resolvers import query as forms_query
from .forms.types import form, form_summary, form_version
from .instances.attachments import query as attachments_query, submission_attachment
from .instances.mutations import mutation as instances_mutation
from .instances.resolvers import query as instances_query
from .instances.types import instance, instance_org_unit
from .org_units.groups import query as groups_query
from .org_units.mutations import mutation as org_units_mutation
from .org_units.org_unit_types import org_unit_type, query as org_unit_types_query
from .org_units.resolvers import query as org_units_query
from .org_units.types import org_unit
from .sources.resolvers import query as sources_query
from .sources.types import data_source
from .tasks.resolvers import query as tasks_query
from .tasks.types import task
from .users.resolvers import query as users_query, user_type


#: Postgres' `timestamptz` rejects a UTC offset of 16 hours or more - an uncaught `DataError` otherwise.
POSTGRES_MAX_TZ_OFFSET = timedelta(hours=16)

date_scalar = ScalarType("Date")
datetime_scalar = ScalarType("DateTime")


@date_scalar.serializer
@datetime_scalar.serializer
def serialize_iso(value):
    return value.isoformat()


@date_scalar.value_parser
def parse_date(value):
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        raise GraphQLError(f"Invalid date {value!r}, expected YYYY-MM-DD")


@datetime_scalar.value_parser
def parse_datetime(value):
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (AttributeError, TypeError, ValueError):
        raise GraphQLError(f"Invalid datetime {value!r}, expected ISO 8601")
    if parsed.utcoffset() is not None and abs(parsed.utcoffset()) >= POSTGRES_MAX_TZ_OFFSET:
        raise GraphQLError(f"Time zone offset in {value!r} must be within 16 hours of UTC.")
    # a naive datetime is in the server time zone, like the v3 `IsoDateTimeFilter`
    return parsed if parsed.tzinfo is not None else timezone.make_aware(parsed)


def object_fields_to_snake_case(name: str, schema: GraphQLSchema, path) -> str:
    """Object fields read the `snake_case` attribute; arguments and `OrgUnitFilter` keys keep their GraphQL name,
    the keys `filters.py` looks up."""
    is_object_field = len(path) == 2 and isinstance(schema.type_map[path[0]], GraphQLObjectType)
    return convert_camel_case_to_snake(name) if is_object_field else name


schema = make_executable_schema(
    # every `.graphql` file below this package: `common.graphql` and one `schema.graphql` per model
    load_schema_from_path(str(Path(__file__).parent)),
    org_units_query,
    org_units_mutation,
    org_unit,
    org_unit_types_query,
    org_unit_type,
    groups_query,
    instances_query,
    instances_mutation,
    instance,
    instance_org_unit,
    attachments_query,
    submission_attachment,
    forms_query,
    forms_mutation,
    form,
    form_summary,
    form_version,
    tasks_query,
    users_query,
    user_type,
    sources_query,
    data_source,
    task,
    input_error,
    date_scalar,
    datetime_scalar,
    upload_scalar,
    convert_names_case=object_fields_to_snake_case,
)
