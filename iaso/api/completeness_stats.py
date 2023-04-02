"""
The completeness stats API endpoint.

This endpoint is used to display the completeness stats in the dashboard. Completeness data is a list rows, each row
for a given form in a given orgunit.

This one is planned to become a "default" and be reused, not to be confused with the more specialized preexisting
completeness API.
"""
from typing import Tuple, Optional, Any
from typing import TypedDict, Mapping, List, Union

import rest_framework.renderers
import rest_framework_csv.renderers
import rest_framework.fields
from django.core.paginator import Paginator
from django.db.models import QuerySet, Count, Q, OuterRef, Subquery, Func, F, OrderBy
from django.db.models.expressions import RawSQL
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer
from typing_extensions import Annotated

from iaso.models import OrgUnit, Form, OrgUnitType, Instance
from .common import HasPermission
from ..models.microplanning import Planning
from ..models.org_unit import OrgUnitQuerySet
from ..periods import Period


def formatted_percentage(part: int, total: int) -> str:
    if total == 0:
        return "N/A"

    return "{:.1%}".format(part / total)


def get_instance_counters(ous_to_fill: "QuerySet[OrgUnit]", form_type: Form) -> Tuple[int, int]:
    """Returns a dict such as (forms to fill counters, forms filled counters) with the number
    of instances to fill and filled for the given form type"""
    filled = ous_to_fill.filter(instance__form=form_type)
    return ous_to_fill.distinct().count(), filled.distinct().count()


def get_number_direct_submissions(ou: OrgUnit, form_type: Form) -> int:
    """Returns the number of direct submissions for the given form type"""
    return form_type.instances.filter(org_unit=ou).count()


def _get_ou_from_request(request: Request, parameter_name: str) -> Optional[OrgUnit]:
    ou_id = request.query_params.get(parameter_name)
    if ou_id is None:
        return None

    return OrgUnit.objects.get(id=ou_id)


class CompletenessStatsViewSet(viewsets.ViewSet):
    """Completeness Stats API"""

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission("menupermissions.iaso_completeness_stats"),
    ]  # type: ignore

    def list(self, request: Request) -> Response:
        order = request.GET.get("order", "name").split(",")
        requested_org_unit_type_str = request.query_params.get("org_unit_type_id", None)

        requested_forms_str = request.query_params.get("form_id", None)
        requested_form_ids = requested_forms_str.split(",") if requested_forms_str is not None else []

        if requested_org_unit_type_str is not None:
            requested_org_unit_types = OrgUnitType.objects.filter(id__in=requested_org_unit_type_str.split(","))
        else:
            requested_org_unit_types = None

        requested_org_unit = _get_ou_from_request(request, "org_unit_id")
        requested_parent_org_unit = _get_ou_from_request(request, "parent_org_unit_id")

        profile = request.user.iaso_profile  # type: ignore

        # Forms to take into account: we take everything for the user's account, then filter by the form_ids if provided
        form_qs = Form.objects.filter_for_user_and_app_id(user=request.user)
        if requested_form_ids:
            form_qs = form_qs.filter(id__in=requested_form_ids)

        account = profile.account
        version = account.default_version

        # Those filters will apply to all OUs touched by this API (listed, counted, etc.)
        common_ou_filters = {"version": version, "validation_status": "VALID"}

        org_units = OrgUnit.objects.filter(version=version).filter(**common_ou_filters)

        # Filtering per org unit: we drop the rows that don't match the requested org_unit
        if requested_org_unit:
            org_units = org_units.hierarchy(requested_org_unit)

        # Filtering per parent org unit: we drop the rows that are not direct children of the requested parent org unit
        if requested_parent_org_unit:
            org_units = org_units.filter(parent=requested_parent_org_unit)

        # Cutting the list, so we only keep the heads (top-level of the selection)
        top_ous = org_units.exclude(parent__in=org_units)

        # Filtering by org unit type
        if requested_org_unit_types is not None:
            # This needs to be applied on the top_ous, not on the org_units (to act as a real filter, not something that changes the level of OUs in the table)
            top_ous = top_ous.filter(org_unit_type__id__in=[o.id for o in requested_org_unit_types])

        top_ous = top_ous.order_by(*order)

        results = []
        for row_ou in top_ous:
            for form in form_qs:
                form = Form.objects.get(id=form.id)

                ou_types_of_form = form.org_unit_types.all()

                # Instance counters for the row OU + all descendants
                ou_to_fill_with_descendants = (
                    row_ou.descendants().filter(org_unit_type__in=ou_types_of_form).filter(**common_ou_filters)
                )  # Apparently .descendants() also includes the row_ou itself

                ou_to_fill_with_descendants_count, ou_filled_with_descendants_count = get_instance_counters(
                    ou_to_fill_with_descendants, form
                )

                # Instance counters strictly/directly for the row OU
                ou_to_fill_direct = (
                    org_units.filter(org_unit_type__in=ou_types_of_form)
                    .filter(pk=row_ou.pk)
                    .filter(**common_ou_filters)
                )
                ou_to_fill_direct_count, ou_filled_direct_count = get_instance_counters(ou_to_fill_direct, form)

                # TODO: response as serializer for Swagger

                parent_data = None
                if row_ou.parent is not None:
                    parent_data = (row_ou.parent.as_dict_for_completeness_stats(),)

                if ou_to_fill_with_descendants_count > 0:
                    results.append(
                        {
                            "parent_org_unit": parent_data,
                            "org_unit_type": row_ou.org_unit_type.as_dict_for_completeness_stats(),
                            "org_unit": row_ou.as_dict_for_completeness_stats(),
                            "form": form.as_dict_for_completeness_stats(),
                            # Those counts target the row org unit and all of its descendants
                            "forms_filled": ou_filled_with_descendants_count,
                            "forms_to_fill": ou_to_fill_with_descendants_count,
                            "completeness_ratio": formatted_percentage(
                                part=ou_filled_with_descendants_count, total=ou_to_fill_with_descendants_count
                            ),
                            # Those counts strictly/directly target the row org unit (no descendants included)
                            "forms_filled_direct": ou_filled_direct_count,
                            "forms_to_fill_direct": ou_to_fill_direct_count,
                            "completeness_ratio_direct": formatted_percentage(
                                part=ou_filled_direct_count, total=ou_to_fill_direct_count
                            ),
                            "has_multiple_direct_submissions": get_number_direct_submissions(row_ou, form) > 1,
                        }
                    )
        limit = int(request.GET.get("limit", 10))
        page_offset = int(request.GET.get("page", "1"))
        paginator = Paginator(results, limit)
        if page_offset > paginator.num_pages:
            page_offset = paginator.num_pages
        page = paginator.page(page_offset)

        paginated_res = {
            "count": paginator.count,
            "results": page.object_list,
            "has_next": page.has_next(),
            "has_previous": page.has_previous(),
            "page": page_offset,
            "pages": paginator.num_pages,
            "limit": limit,
        }

        return Response(paginated_res)


class OrgUnitTypeSerializer(ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "depth"]


class FormStatAnnotation(TypedDict):
    form_stats: Mapping[str, Mapping]


OrgUnitWithFormStat = Annotated[OrgUnit, FormStatAnnotation]

from rest_framework import serializers


class Params(TypedDict):
    org_unit_type: Optional[OrgUnitType]
    parent_org_unit: Optional[OrgUnit]
    forms: QuerySet[Form]
    planning: Optional[Planning]
    period: Optional[str]  # might migrate to Period in the future
    order: List[str]


class PrimaryKeysRelatedField(serializers.ManyRelatedField):
    """Primary key separated by , like we do often in iaso"""

    def get_value(self, dictionary: Mapping[Any, Any]) -> Union[Any, List[Any]]:
        if self.field_name not in dictionary:
            return rest_framework.fields.empty
        else:
            value = dictionary.get(self.field_name)
            return value.split(",")


# noinspection PyMethodMayBeStatic
class ParamSerializer(serializers.Serializer):
    """Serializer for the get params"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")
        # filter on what the user has access to
        if request:
            user = request.user
            # we could filter but since it's an additional it probably just a waste
            self.fields["org_unit_type_id"].queryset = OrgUnitType.objects.filter_for_user_and_app_id(user, None)
            self.fields["parent_org_unit_id"].queryset = OrgUnit.objects.filter_for_user(user)
            # Forms to take into account: we take everything for the user's account, then filter by the form_ids if provided
            self.fields["form_id"].default = Form.objects.filter_for_user_and_app_id(user)
            self.fields["form_id"].child_relation.queryset = Form.objects.filter_for_user_and_app_id(user)
            self.fields["planning_id"].queryset = Planning.objects.filter_for_user(user)

    org_unit_type_id = serializers.PrimaryKeyRelatedField(
        source="org_unit_type",
        queryset=OrgUnitType.objects.none(),
        required=False,
        help_text="Group the submissions per this org unit type",
        default=None,
    )
    parent_org_unit_id = serializers.PrimaryKeyRelatedField(
        queryset=OrgUnit.objects.none(),
        source="parent_org_unit",
        required=False,
        help_text="Use this as the root. If not present will take the root per users",
    )
    form_id = PrimaryKeysRelatedField(
        required=False,
        source="forms",
        help_text="Filter on these form ids (list separated by ','",
        child_relation=serializers.PrimaryKeyRelatedField(
            queryset=Form.objects.none(),
        ),
    )
    planning_id = serializers.PrimaryKeyRelatedField(
        source="planning", queryset=Planning.objects.none(), required=False, help_text="Filter on this planning"
    )
    order = serializers.CharField(default="name")  # actually a list in validated data
    period = serializers.CharField(required=False, help_text="Filter period in this instances")

    def validate_order(self, order):
        return order.split(",")

    def validate_period(self, period_value):
        try:
            Period.from_string(period_value)
        except ValueError:
            raise serializers.ValidationError("Invalid period")
        return period_value

    def validate_form_id(self, forms: Union[List[Form], QuerySet[Form]]):
        # reconvert this to a queryset
        if isinstance(forms, list):
            queryset = self.fields["form_id"].child_relation.queryset
            return queryset.filter(id__in=[f.id for f in forms])
        else:
            return forms


class CompletenessStatsV2ViewSet(viewsets.ViewSet):
    """Completeness Stats API"""

    renderer_classes = [
        rest_framework.renderers.JSONRenderer,
        rest_framework.renderers.BrowsableAPIRenderer,
        rest_framework_csv.renderers.PaginatedCSVRenderer,
    ]
    serializer_class = ParamSerializer

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission("menupermissions.iaso_completeness_stats"),
    ]  # type: ignore

    # @swagger_auto_schema(query_serializer=ParamSerializer())
    def list(self, request: Request, *args, **kwargs) -> Response:
        """Completeness of form submission"""
        paramsSerializer = ParamSerializer(data=request.query_params, context={"request": request})
        paramsSerializer.is_valid(raise_exception=True)
        params: Params = paramsSerializer.validated_data

        orders = params["order"]
        form_qs = params["forms"]
        period = params.get("period", None)
        planning = params.get("planning", None)

        instance_qs = Instance.objects.all()
        if period:
            # In the future we would like to support multiple periods, but then we will have to count properly
            # the requirements
            instance_qs = instance_qs.filter(period=period)
        if planning:
            instance_qs = instance_qs.filter(planning_id=planning.id)
            # the current planning filter has limitation as it filter the submissiosn but not the org unit
            #  that need filing according to the planing. so the percentage are wrong.

        requested_org_unit_types = None

        profile = request.user.iaso_profile  # type: ignore

        org_units: OrgUnitQuerySet
        org_units = OrgUnit.objects.filter(validation_status__in=(OrgUnit.VALIDATION_NEW, OrgUnit.VALIDATION_VALID))
        # Calculate the ou for which we want reporting `top_ous`
        #  We only want ou to which user has access
        #   if no params we return the top ou for the default source
        #  if user asked for a parent ou we filter on this
        #   if user asked for a org unit type we "group" by this otherwise take the top.

        # so basically 4 case:
        #  a. no params. Take the roots for the default source (or for the users)
        #  b. parent ou but no org unit type: take the child of that parent
        #  c. org unit type with parent: From the descendant of that parent, take orgunit of this type
        #  d. org unit type with no parent: Idem but with orgunit type from a.

        parent_ou = params.get("parent_org_unit")

        # Filtering per parent org unit: we drop the rows that are not direct children of the requested parent org unit
        if parent_ou:
            org_units = org_units.hierarchy(parent_ou)
        else:
            account = profile.account
            version_id = account.default_version_id
            org_units = org_units.filter(version_id=version_id)
            # we want everything in the source, but we will filter for what the user has access too.
            if profile.org_units.all():
                # do the intersection
                roots = org_units.filter(id__in=profile.org_units.all())
                # take the whole hierarchy
                org_units = org_units.hierarchy(roots)

        # How we group them. If none we take the direct descendants or the roots
        group_per_type = params["org_unit_type"]
        if not group_per_type:
            if parent_ou:
                top_ous = org_units.filter(parent=parent_ou)
            elif profile.org_units.all():
                top_ous = org_units.filter(id__in=profile.org_units.all())
            else:
                top_ous = org_units.filter(parent=None)
        else:
            top_ous = org_units.filter(org_unit_type__in=requested_org_unit_types)

        # End calculation of top ous
        top_ous = top_ous.prefetch_related("org_unit_type", "parent")

        # Annotate the query with the form info
        ou_with_stats = get_annotated_queryset(root_qs=top_ous, form_qs=form_qs, instance_qs=instance_qs)
        # Ordering
        # Transform the order parameter to handle the json properly
        converted_orders = []
        for order in orders:
            if not (order.startswith("form_stats") or order.startswith("-form_stats")):
                converted_orders.append(order)
            else:
                # Expect something like `form_stats__form_12__total_instances`
                order_parts = order.split("__")
                order_form_slug = order_parts[1]
                order_form_field = order_parts[2]
                descending = order.startswith("-")
                # Need the cast otherwise it comparse as string and put "14" before "5"
                order_exp = OrderBy(
                    RawSQL("CAST(form_stats#>>%s as float)", [[order_form_slug, order_form_field]]),
                    descending=descending,
                    nulls_last=True,  # always put the nulls results last
                )
                converted_orders.append(order_exp)

        ou_with_stats = ou_with_stats.order_by(*converted_orders)

        def to_dict(row_ou: OrgUnitWithFormStat):
            return {
                "name": row_ou.name,
                "id": row_ou.id,
                "org_unit": row_ou.as_dict_for_completeness_stats(),
                "form_stats": row_ou.form_stats,
                "org_unit_type": row_ou.org_unit_type.as_dict_for_completeness_stats(),
                "parent_org_unit": row_ou.parent.as_dict_for_completeness_stats() if row_ou.parent else None,
            }

        # convert to proper pagination
        limit = int(request.GET.get("limit", 10))
        page_offset = int(request.GET.get("page", "1"))
        paginator = Paginator(ou_with_stats, limit)
        if page_offset > paginator.num_pages:
            page_offset = paginator.num_pages
        page = paginator.page(page_offset)

        # fix a bug somewhere in django-cte and pagination that make the whole thing crash
        # if the set is empty
        if paginator.count <= 0:
            object_list = []
        else:
            object_list = [to_dict(ou) for ou in page.object_list]

        # If a particular parent is requested we calculate its own stats
        #  and put it on the top of the list
        if parent_ou:
            ou_qs = OrgUnit.objects.filter(id=parent_ou.id)
            ou_qs = get_annotated_queryset(ou_qs, instance_qs, form_qs)

            top_row_ou = to_dict(ou_qs.first())
            top_row_ou["is_root"] = True
            object_list.insert(0, top_row_ou)

        paginated_res = {
            # Metadata outside pagination to help the frontend make the form columns
            "forms": [
                {
                    "id": form.id,
                    "name": form.name,
                    "slug": f"form_{form.id}",  # accessor in the form stats dict
                }
                for form in form_qs
            ],
            "count": paginator.count,
            "results": object_list,
            "has_next": page.has_next(),
            "has_previous": page.has_previous(),
            "page": page_offset,
            "pages": paginator.num_pages,
            "limit": limit,
        }

        return Response(paginated_res)

    @action(methods=["GET"], detail=False)
    def types_for_version_ou(self, request):
        "all the org unit type below this ou, or all in version"
        org_units = OrgUnit.objects.filter_for_user(request.user)
        org_unit_id = self.request.query_params.get("org_unit_id")
        version_id = self.request.query_params.get("version_id")
        if org_unit_id is not None:
            top_org_unit = get_object_or_404(org_units, id=org_unit_id)
            org_units = org_units.hierarchy(top_org_unit)
        if version_id is not None:
            if version_id == ":default":
                default_version = self.request.user.iaso_profile.account.default_version
                org_units = org_units.filter(version=default_version)
            else:
                org_units = org_units.filter(version_id=version_id)
        types = OrgUnitType.objects.filter(id__in=org_units.values("org_unit_type").distinct()).order_by("depth")
        serialized = OrgUnitTypeSerializer(types, many=True).data
        return Response(serialized)


# noinspection SqlResolve
PIVOT_QUERY = """SELECT JSONB_OBJECT_AGG(
                   'form_' || "iaso_form"."id", JSON_BUILD_OBJECT(
                'descendants', COALESCE(count_per_root."descendants", 0),
                'descendants_ok', COALESCE(count_per_root."descendants_ok", 0),
                'percent', COALESCE(count_per_root."percent", 0),
                'total_instances', COALESCE(count_per_root."total_instances", 0),
                'itself_target', COALESCE(count_per_root."itself_target", 0),
                'itself_has_instances', COALESCE(count_per_root."itself_has_instances", 0),
                'itself_instances_count', COALESCE(count_per_root."itself_instances_count", 0),
                'name', "iaso_form"."name"
            )
           )             AS "form_stats",
       filtered_roots.id AS org_unit_id
FROM filtered_roots
         CROSS JOIN filtered_forms AS iaso_form
         LEFT OUTER JOIN "count_per_root" ON (count_per_root.form_id = iaso_form.id AND
                                              count_per_root.id = filtered_roots.id)
GROUP BY filtered_roots.id
               """

from django_cte import With
from django.db import models
from django_cte.raw import raw_cte_sql

# noinspection SqlResolve
OU_COUNT_QUERY = """ 
SELECT "iaso_orgunit"."path",
       "iaso_form"."id"                         AS "form_id",
       COUNT("iaso_instance"."id") FILTER
           (WHERE
               ("iaso_instance"."file" IS NOT NULL AND NOT "iaso_instance"."file" = '') AND
               NOT ("iaso_instance"."deleted")) AS "instances_count"
FROM "filtered_forms" AS "iaso_form"
         JOIN "iaso_form_org_unit_types"
              ON "iaso_form"."id" = "iaso_form_org_unit_types"."form_id"
         LEFT OUTER JOIN "iaso_orgunit"
                         ON ("iaso_orgunit"."org_unit_type_id" =
                             "iaso_form_org_unit_types"."orgunittype_id")
         LEFT OUTER JOIN "filtered_instance" AS iaso_instance
                         ON ("iaso_orgunit"."id" =
                             "iaso_instance"."org_unit_id" AND
                             "iaso_form"."id" =
                             "iaso_instance"."form_id")
GROUP BY "iaso_orgunit"."path", "iaso_form"."id"
                  """

# noinspection SqlResolve
COUNT_PER_ROOT_QUERY = """
SELECT root.id,
       "ou_count"."form_id" ,
       COUNT(ou_count.path) FILTER (WHERE "root"."path" != ou_count."path")                         AS "descendants",
       SUM(ou_count."instances_count")
       FILTER (WHERE "root"."path" != ou_count."path")                                              AS "total_instances",
       COUNT(NULLIF(ou_count."instances_count", 0))
       FILTER (WHERE "root"."path" != ou_count."path")                                              AS "descendants_ok",
       (COUNT(NULLIF(ou_count."instances_count", 0)) FILTER (WHERE "root"."path" != ou_count."path") ::float *
        100 /
        NULLIF(COUNT(ou_count) FILTER (WHERE "root"."path" != ou_count."path"),
               0))                                                                                          AS "percent",

       COUNT(NULLIF(ou_count."instances_count", 0))
       FILTER (WHERE "root"."path" = ou_count."path")                                               AS "itself_has_instances",
       SUM(ou_count."instances_count")
       FILTER (WHERE "root"."path" = ou_count."path")                                               AS "itself_instances_count",
       COUNT(ou_count) FILTER (WHERE "root"."path" = ou_count."path")                               AS "itself_target"
FROM filtered_roots AS root
         LEFT OUTER JOIN ou_count ON "root"."path" @> ou_count."path"
GROUP BY root.id, ou_count.form_id"""


def get_annotated_queryset(root_qs: QuerySet[OrgUnit], instance_qs: QuerySet[Instance], form_qs: QuerySet[Form]):
    """Annotate via CTE

    This is 10 times slower that the previous version but the only way I found to implement
    filter without it being a mess. 0.3s -> 3s on my benchmark"""

    # root_qs = OrgUnit.objects.prefetch_related("org_unit_type").filter(parent_id=162489)
    # form_qs = Form.objects.filter(id__in=(17, 12, 13))
    # Name are reference by the other cte query so don't modify them
    ou_cte = With(root_qs, name="filtered_roots")
    form_cte = With(form_qs.only("id", "name"), name="filtered_forms")
    instances_cte = With(instance_qs.only("id", "org_unit_id", "form_id", "file", "deleted"), name="filtered_instance")

    pivot_cte = raw_cte_sql(
        sql=PIVOT_QUERY,
        params=[],
        refs={
            "form_stats": models.JSONField(),
            "org_unit_id": models.ForeignKey("iaso.orgunit", on_delete=models.PROTECT),
        },
    )
    pivot_with = With(pivot_cte, name="pivot")
    ou_count_cte = raw_cte_sql(
        OU_COUNT_QUERY,
        [],
        {
            "path": models.CharField(),
            "form_id": models.IntegerField(),
            "instances_count": models.IntegerField(),
        },
    )
    ou_count_with = With(ou_count_cte, name="ou_count")

    count_per_root_cte = raw_cte_sql(COUNT_PER_ROOT_QUERY, [], {})
    count_per_root_with = With(count_per_root_cte, "count_per_root")

    annotated_query: QuerySet[OrgUnitWithFormStat] = (
        pivot_with.join(root_qs, id=pivot_with.col.org_unit_id)
        .with_cte(pivot_with)
        .with_cte(count_per_root_with)
        .with_cte(ou_count_with)
        .with_cte(ou_cte)
        .with_cte(form_cte)
        .with_cte(instances_cte)
        .annotate(form_stats=pivot_with.col.form_stats)
    )
    return annotated_query
