"""
The completeness stats API endpoint.

This endpoint is used to display the completeness stats in the dashboard. Completeness data is a list rows, each row
 given orgunit with a form_stats dict that contain a key for each form `form_XX` with the value a dict with the stats
 for that form see FormStatAnnotation

```json
              "form_stats": {
                "form_13": {
                    "name": "Quality PCA form 2.38.2.1",
                    "percent": 0,
                    "descendants": 0,
                    "itself_target": 0,
                    "descendants_ok": 0,
                    "total_instances": 0,
                    "itself_has_instances": 0,
                    "itself_instances_count": 0
                },
                "form_16": {
                    "name": "Event Tracker 2.38.2.1",
                    "percent": 0,
                    "descendants": 0,
                    "itself_target": 0,
                    "descendants_ok": 0,
                    "total_instances": 0,
                    "itself_has_instances": 0,
                    "itself_instances_count": 0
                }
```
"""
from typing import Optional, Any
from typing import TypedDict, Mapping, List, Union

import rest_framework.fields
import rest_framework.renderers
import rest_framework_csv.renderers
from django.core.paginator import Paginator
from django.db import models
from django.db.models import QuerySet, OrderBy, Q
from django.db.models.expressions import RawSQL
from django_cte import With
from django_cte.raw import raw_cte_sql
from rest_framework import serializers
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer
from typing_extensions import Annotated

from iaso.models import OrgUnit, Form, OrgUnitType, Instance, Group
from .common import HasPermission
from ..models.microplanning import Planning
from ..models.org_unit import OrgUnitQuerySet
from ..periods import Period
from iaso.utils import geojson_queryset
from hat.menupermissions import models as permission


class OrgUnitTypeSerializer(ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "depth"]


class FormStatDict(TypedDict):
    name: str  # name of the form. for debug
    descendants: int  # number of descendant org unit that should fill this form
    descendants_ok: int  # number of descendants org unit that have this form filled
    percent: int  # descendants_ok / descendants
    total_instances: int  # total submissions for this for on descendant and itself
    itself_target: int  # does the orgunit need to fill the form
    itself_has_instances: int  # does the orgunit have any submission for this form
    itself_instances_count: int  # how many submission for this form are on this instance


class FormStatAnnotation(TypedDict):
    # Key is a slug for a form e.g `form_12`
    form_stats: Mapping[str, FormStatDict]


OrgUnitWithFormStat = Annotated[OrgUnit, FormStatAnnotation]


class Params(TypedDict):
    org_unit_types: Optional[List[OrgUnitType]]
    parent_org_unit: Optional[OrgUnit]
    forms: QuerySet[Form]
    planning: Optional[Planning]
    period: Optional[str]  # might migrate to Period in the future
    order: List[str]
    org_unit_group: Optional[Group]
    without_submissions: bool
    org_unit_validation_status: List[str]


class PrimaryKeysRelatedField(serializers.ManyRelatedField):
    """Primary key separated by , like we do often in iaso"""

    def get_value(self, dictionary: Mapping[Any, str]) -> Union[Any, List[Any]]:
        if self.field_name not in dictionary:
            return rest_framework.fields.empty
        else:
            value: str
            value = dictionary[self.field_name]
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
            self.fields["org_unit_type_ids"].child_relation.queryset = OrgUnitType.objects.filter_for_user_and_app_id(
                user, None
            ).distinct()
            self.fields["org_unit_group_id"].queryset = Group.objects.filter_for_user(user)
            self.fields["parent_org_unit_id"].queryset = OrgUnit.objects.filter_for_user(user)
            # Forms to take into account: we take everything for the user's account, then filter by the form_ids if provided
            self.fields["form_id"].default = Form.objects.filter_for_user_and_app_id(user).distinct()[:5]
            self.fields["form_id"].child_relation.queryset = Form.objects.filter_for_user_and_app_id(user).distinct()
            self.fields["planning_id"].queryset = Planning.objects.filter_for_user(user)

    org_unit_type_ids = PrimaryKeysRelatedField(
        child_relation=serializers.PrimaryKeyRelatedField(queryset=OrgUnitType.objects.none()),
        source="org_unit_types",
        required=False,
        help_text="Group the submissions per this org unit type",
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
    without_submissions = serializers.BooleanField(
        default=False, help_text="Only return orgunit without direct submissions"
    )
    org_unit_group_id = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.none(),
        source="org_unit_group",
        required=False,
        help_text="Filter the orgunit used for count on this group",
    )

    org_unit_validation_status = serializers.CharField(
        default="VALID",
        help_text="Filter org unit on theses validation status"
        " (both for returned orgunit and count), can specify multiple status, separated by a ','",
    )
    as_location = serializers.CharField(required=False, help_text="Filter only org units with geo locations")

    def validate_org_unit_validation_status(self, statuses):
        statuses = statuses.split(",")
        for status in statuses:
            # TODO: this should come from , OrgUnit.VALIDATION_STATUS_CHOICES
            if status not in (OrgUnit.VALIDATION_VALID, OrgUnit.VALIDATION_NEW, OrgUnit.VALIDATION_REJECTED):
                raise serializers.ValidationError("Invalid status")
        return statuses

    def validate_order(self, order):
        return order.split(",")

    def validate_period(self, period_value):
        try:
            Period.from_string(period_value)
        except ValueError:
            raise serializers.ValidationError("Invalid period")
        return period_value

    def validate_form_id(self, forms: Union[List[Form], QuerySet[Form]]):
        # reconvert this to a queryset, if this is a List.
        # resolve problem with duplicate Form if form is in multiple project
        # This method seems faster than using a distinct()
        return Form.objects.filter(id__in=[f.id for f in forms])


def has_children(row_ou):
    children_count = row_ou.descendants().exclude(pk=row_ou.id).count()
    return True if children_count > 0 else False


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
        HasPermission(permission.COMPLETENESS_STATS, permission.REGISTRY),  # type: ignore
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
        org_unit_validation_status = params["org_unit_validation_status"]
        as_location = params.get("as_location", None)

        instance_qs = Instance.objects.all()
        if period:
            # In the future we would like to support multiple periods, but then we will have to count properly
            # the requirements
            instance_qs = instance_qs.filter(period=period)
        if planning:
            instance_qs = instance_qs.filter(planning_id=planning.id)
            form_qs = form_qs.filter(plannings=planning)

        profile = request.user.iaso_profile  # type: ignore

        org_units: OrgUnitQuerySet
        org_units = OrgUnit.objects.filter(validation_status__in=org_unit_validation_status)  # type: ignore
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
        group_per_types = params.get("org_unit_types")
        if not group_per_types:
            if parent_ou:
                top_ous = org_units.filter(parent=parent_ou)
            elif profile.org_units.all():
                top_ous = org_units.filter(id__in=profile.org_units.all())
            else:
                top_ous = org_units.filter(parent=None)
        else:
            top_ous = org_units.filter(org_unit_type__in=group_per_types)

        top_ous = top_ous.prefetch_related("org_unit_type", "parent")
        # End calculation of top ous

        # Orgunit on which we count the Submissions
        orgunit_qs: OrgUnitQuerySet
        orgunit_qs = OrgUnit.objects.filter(validation_status__in=org_unit_validation_status)  # type: ignore

        org_unit_group = params.get("org_unit_group")
        if org_unit_group:
            orgunit_qs = orgunit_qs.filter(groups__id=org_unit_group.id)
        orgunit_qs = orgunit_qs.hierarchy(top_ous)
        if planning:
            # Only keep OrgUnit assigned on planning. For now They are considered to be filled if a user is directly
            #  on them (not a team)
            assigned_orgunits = OrgUnit.objects.filter(
                assignment__in=planning.assignment_set.filter(user__isnull=False)
            )

            # Pass by the ids to avoid strange effects.
            planning_orgunit_ids = list(assigned_orgunits.distinct().values_list("id", flat=True))
            orgunit_qs = orgunit_qs.filter(id__in=planning_orgunit_ids)
        # Annotate the query with the form info
        ou_with_stats = get_annotated_queryset(
            root_qs=top_ous, form_qs=form_qs, instance_qs=instance_qs, orgunit_qs=orgunit_qs
        )

        # Ordering
        # Transform the order parameter to handle the json properly
        converted_orders: List[Union[str, OrderBy]] = []
        for order in orders:
            # There is an issue with using orgunit__name as it does a supplementary outer join that duplicate lines
            # and break pagination
            if order == "orgunit__name" or order == "-orgunit__name":
                raise serializers.ValidationError(
                    {"order": ["Sorting by `orgunit__name` is not supported, please use `name` instead"]}
                )
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

        # filter on orgunit without submissions
        if params.get("without_submissions"):
            for form in form_qs:
                slug = f"form_{form.id}"
                ou_with_stats = ou_with_stats.exclude(
                    RawSQL(
                        "CAST(form_stats#>>%s as integer) > 0",
                        [[slug, "itself_has_instances"]],
                        output_field=models.BooleanField(),
                    ),
                )

        def to_dict(row_ou: OrgUnitWithFormStat):
            return {
                "name": row_ou.name,
                "id": row_ou.id,
                "org_unit": row_ou.as_dict_for_completeness_stats(),
                "form_stats": row_ou.form_stats,
                "org_unit_type": row_ou.org_unit_type.as_dict_for_completeness_stats() if row_ou.org_unit_type else {},
                "parent_org_unit": row_ou.parent.as_dict_for_completeness_stats_with_parent()
                if row_ou.parent
                else None,
                "has_children": has_children(row_ou),
            }

        def to_map(row_ou: OrgUnitWithFormStat):
            temp_org_unit = {
                "name": row_ou.name,
                "id": row_ou.id,
                "form_stats": row_ou.form_stats,
                "has_geo_json": True if row_ou.simplified_geom else False,
                "geo_json": None,
                "latitude": row_ou.location.y if row_ou.location else None,
                "longitude": row_ou.location.x if row_ou.location else None,
                "altitude": row_ou.location.z if row_ou.location else None,
                "org_unit_type": row_ou.org_unit_type.as_dict_for_completeness_stats() if row_ou.org_unit_type else {},
                "parent_org_unit": row_ou.parent.as_dict_for_completeness_stats_with_parent()
                if row_ou.parent
                else None,
                "has_children": has_children(row_ou),
            }
            if temp_org_unit["has_geo_json"] == True:
                shape_queryset = OrgUnit.objects.all().filter(id=temp_org_unit["id"])
                temp_org_unit["geo_json"] = geojson_queryset(shape_queryset, geometry_field="simplified_geom")
            return temp_org_unit

        def with_parent(list_objects, is_map):
            # If a particular parent is requested we calculate its own stats
            #  and put it on the top of the list
            temp_list = list_objects
            if parent_ou and not params.get("without_submissions"):
                ou_qs = OrgUnit.objects.filter(id=parent_ou.id)
                ou_qs = get_annotated_queryset(ou_qs, orgunit_qs, instance_qs, form_qs)

                top_row_ou = to_dict(ou_qs[0]) if not is_map else to_map(ou_qs[0])
                top_row_ou["is_root"] = True
                temp_list.insert(0, top_row_ou)
            return temp_list

        limit = request.GET.get("limit", None)
        # convert to proper pagination
        page_offset = int(request.GET.get("page", "1"))

        if limit is not None:
            paginator = Paginator(ou_with_stats, int(limit))
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            # fix a bug somewhere in django-cte and pagination that make the whole thing crash
            # if the set is empty
            if paginator.count <= 0:
                object_list = []
            else:
                object_list = [to_dict(ou) for ou in page.object_list]
            object_list = with_parent(object_list, False)

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
                "limit": int(limit),
            }

            return Response(paginated_res)
        if as_location:
            print("ICI")
            print(as_location)
            ou_with_stats = ou_with_stats.filter(Q(location__isnull=False) | Q(simplified_geom__isnull=False))
            object_list = with_parent([to_map(ou) for ou in ou_with_stats], True)
        else:
            object_list = with_parent([to_dict(ou) for ou in ou_with_stats], True)
        return Response({"results": object_list})

    @action(methods=["GET"], detail=False)
    def types_for_version_ou(self, request):
        """all the org unit type below this ou, or all in version.

        Used in the type dropdown to provide reasonable choices"""
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
         LEFT OUTER JOIN "filtered_orgunit"  AS "iaso_orgunit"
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


def get_annotated_queryset(
    root_qs: QuerySet[OrgUnit], orgunit_qs: QuerySet[OrgUnit], instance_qs: QuerySet[Instance], form_qs: QuerySet[Form]
):
    """Annotate the form stats via CTE. Add a form_stat annotation

    This is 10 times slower that the previous version but the only way I found to implement
    filter without it being a mess. 0.3s -> 3s on my benchmark

    :param root_qs: OrgUnits for which starts are calculated. This is the queryset that's annotated
    :param orgunit_qs: OrgUnit on which we count the instances. to be used for filtering
    :param form_qs: Form for which we count the instance. Each "column" in the json
    :param instance_qs: Instance to count. to be used for filter. eg on a period


    """

    # Name are referenced by the other cte query so don't modify them
    root_ou_cte = With(root_qs, name="filtered_roots")
    form_cte = With(form_qs.only("id", "name"), name="filtered_forms")
    instances_cte = With(instance_qs.only("id", "org_unit_id", "form_id", "file", "deleted"), name="filtered_instance")
    filter_ou_cte = With(orgunit_qs.only("id", "org_unit_type_id", "path"), name="filtered_orgunit")

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
        .with_cte(root_ou_cte)
        .with_cte(form_cte)
        .with_cte(instances_cte)
        .with_cte(filter_ou_cte)
        .annotate(form_stats=pivot_with.col.form_stats)
    )
    return annotated_query
