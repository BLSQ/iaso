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

from typing import List, Union

import rest_framework.renderers

from django.core.paginator import Paginator
from django.db import models
from django.db.models import OrderBy, Q
from django.db.models.expressions import RawSQL
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response

from iaso.models import Instance, OrgUnit, OrgUnitType
from iaso.permissions.core_permissions import (
    CORE_COMPLETENESS_STATS_PERMISSION,
    CORE_REGISTRY_READ_PERMISSION,
    CORE_REGISTRY_WRITE_PERMISSION,
)
from iaso.utils import geojson_queryset

from ...models.org_unit import OrgUnitQuerySet
from ..common import HasPermission
from .queries import get_annotated_queryset
from .renderers import CompletenessStatsCSVRenderer
from .serializers import OrgUnitTypeSerializer, OrgUnitWithFormStat, Params, ParamSerializer


def has_children(row_ou):
    children_count = row_ou.descendants().exclude(pk=row_ou.id).count()
    return True if children_count > 0 else False


@extend_schema(tags=["Completeness statistics", "v2"])
class CompletenessStatsV2ViewSet(viewsets.ViewSet):
    """Completeness Stats API"""

    renderer_classes = [
        rest_framework.renderers.JSONRenderer,
        rest_framework.renderers.BrowsableAPIRenderer,
        CompletenessStatsCSVRenderer,
    ]
    serializer_class = ParamSerializer

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(
            CORE_COMPLETENESS_STATS_PERMISSION, CORE_REGISTRY_WRITE_PERMISSION, CORE_REGISTRY_READ_PERMISSION
        ),  # type: ignore
    ]  # type: ignore

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
        teams = params.get("teams")
        users = params.get("users")
        projects = params.get("projects")

        instance_qs = Instance.objects.all()

        if period:
            # In the future we would like to support multiple periods, but then we will have to count properly
            # the requirements
            instance_qs = instance_qs.filter(period=period)
        if planning:
            instance_qs = instance_qs.filter(planning=planning)
            form_qs = form_qs.filter(plannings=planning)

        # filter instance_qs on users related to selected teams
        if teams:
            instance_qs = instance_qs.filter(created_by__teams__in=teams)

        # filter instance_qs on users
        if users:
            instance_qs = instance_qs.filter(created_by__in=users)

        # filter instance_qs and form_qs on projects
        if projects:
            instance_qs = instance_qs.filter(project__in=projects)
            form_qs = form_qs.filter(projects__in=projects).distinct("id")

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
            if not order.startswith(("form_stats", "-form_stats")):
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
                "org_unit": row_ou.as_minimal_dict(),
                "form_stats": row_ou.form_stats,
                "org_unit_type": row_ou.org_unit_type.as_minimal_dict() if row_ou.org_unit_type else {},
                "parent_org_unit": row_ou.parent.as_minimal_dict_with_parent() if row_ou.parent else None,
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
                "org_unit_type": row_ou.org_unit_type.as_minimal_dict() if row_ou.org_unit_type else {},
                "parent_org_unit": row_ou.parent.as_minimal_dict_with_parent() if row_ou.parent else None,
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

                if ou_qs.count() > 0:
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
        object_list = []
        if as_location:
            ou_with_stats = ou_with_stats.filter(Q(location__isnull=False) | Q(simplified_geom__isnull=False))
            if ou_with_stats.count() > 0:
                object_list = with_parent([to_map(ou) for ou in ou_with_stats], True)
        else:
            if ou_with_stats.count() > 0:
                object_list = with_parent([to_dict(ou) for ou in ou_with_stats], True)
        return Response(
            {
                "results": object_list,
                "forms": [
                    {
                        "id": form.id,
                        "name": form.name,
                        "slug": f"form_{form.id}",
                    }
                    for form in form_qs
                ],
            }
        )

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
