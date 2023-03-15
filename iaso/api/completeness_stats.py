"""
The completeness stats API endpoint.

This endpoint is used to display the completeness stats in the dashboard. Completeness data is a list rows, each row
for a given form in a given orgunit.

This one is planned to become a "default" and be reused, not to be confused with the more specialized preexisting
completeness API.
"""
from typing import Tuple, Optional

from django.core.paginator import Paginator
from django.db.models import QuerySet, Count, Q, OuterRef, Subquery, Func, F
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer

from iaso.models import OrgUnit, Form, OrgUnitType, SourceVersion
from .common import HasPermission
from ..models.org_unit import OrgUnitQuerySet


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


SUB_COMPLETENESS_QUERY_TEMPLATE = """SELECT JSON_OBJECT_AGG(
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
                   ) AS "form_stats"
        FROM
            (SELECT "iaso_orgunit"."id"                          AS "id",
                     COUNT(ou_count)                                   FILTER (WHERE "iaso_orgunit"."path" != ou_count."path")    AS "descendants",
                     SUM(ou_count."instances_count")           FILTER (WHERE "iaso_orgunit"."path" != ou_count."path")     AS "total_instances",
                     COUNT(NULLIF(ou_count."instances_count", 0)) FILTER (WHERE "iaso_orgunit"."path" != ou_count."path")  AS "descendants_ok",
                     (COUNT(NULLIF(ou_count."instances_count", 0)) FILTER (WHERE "iaso_orgunit"."path" != ou_count."path") ::float * 100 /
                      NULLIF(COUNT(ou_count)    FILTER (WHERE "iaso_orgunit"."path" != ou_count."path")              , 0)) AS "percent",
                     "ou_count"."form_id" ,
                     "ou_count"."form_name"                       AS "form_name",
                      COUNT(NULLIF(ou_count."instances_count", 0))  FILTER (WHERE "iaso_orgunit"."path" = ou_count."path")  AS "itself_has_instances",
                      SUM(ou_count."instances_count")               FILTER (WHERE "iaso_orgunit"."path" = ou_count."path")  AS "itself_instances_count",
                      COUNT(ou_count)                               FILTER (WHERE "iaso_orgunit"."path" = ou_count."path")  AS "itself_target"
              FROM (SELECT "iaso_orgunit"."path",
                           "iaso_form"."id"                         AS "form_id",
                           "iaso_form"."name"                       AS "form_name",
                           COUNT("iaso_instance"."id") FILTER
                               (WHERE
                                   ("iaso_instance"."file" IS NOT NULL AND NOT "iaso_instance"."file" = '') AND
                                   NOT ("iaso_instance"."deleted")
                                   {additional_instance_args}
                                   ) AS "instances_count"
                                   
                    FROM "iaso_form"
                             LEFT OUTER JOIN "iaso_form_org_unit_types"
                                  ON "iaso_form"."id" = "iaso_form_org_unit_types"."form_id"
                             LEFT OUTER JOIN "iaso_orgunit"
                                             ON ("iaso_orgunit"."org_unit_type_id" =
                                                 "iaso_form_org_unit_types"."orgunittype_id")
                             LEFT OUTER JOIN "iaso_instance"
                                             ON ("iaso_orgunit"."id" =
                                                 "iaso_instance"."org_unit_id" AND
                                                 "iaso_form"."id" =
                                                 "iaso_instance"."form_id")
                    WHERE "iaso_form"."id" IN %s
                      AND "iaso_orgunit"."validation_status" IN ('VALID', 'NEW')
                    GROUP BY "iaso_orgunit"."path", "iaso_form"."id") AS ou_count
              WHERE "iaso_orgunit"."path" @> ou_count."path"
                -- don't count yourself
                -- AND "iaso_orgunit"."path" != ou_count."path"
              GROUP BY "iaso_orgunit"."id", ou_count."form_id", "ou_count"."form_name"
              ORDER BY "descendants" DESC) AS count_per_root
                -- THIS JOIN IS NEED so we have a form entry even for org unit which
                -- have no descendant that need to be filled.
                -- not sure of the performance impact, this might be faster to resolve in frontend
        RIGHT JOIN iaso_form ON count_per_root.form_id = iaso_form.id
        WHERE iaso_form.id IN %s
        GROUP BY "iaso_orgunit"."id"
        """
"""QUERY To get completeness as embedded in a select
take in parameters  the form_ids"""

COMPLETNESS_QUERY = """SELECT parent_id, id, name,
       (SELECT 
               JSON_OBJECT_AGG(
                           'form_' || "iaso_form"."id", JSON_BUILD_OBJECT(
                       'descendants', root_form."descendants",
                       'descendants_ok', root_form."descendants_ok",
                       'percent', root_form."percent",
                       'name', "iaso_form"."name"
                   )
                   ) AS "form_stats"
        FROM "iaso_orgunit" AS "roots_to_pivot"
                 CROSS JOIN "iaso_form"
                 LEFT JOIN (SELECT "root"."id"                                  AS "org_unit_id",
                                   COUNT(ou_count)                              AS "descendants",
                                   SUM(ou_count."instances_count")              AS "total_instance",
                                   COUNT(NULLIF(ou_count."instances_count", 0)) AS "descendants_ok",
                                   (COUNT(NULLIF(ou_count."instances_count", 0))::float * 100 /
                                    NULLIF(COUNT(ou_count), 0))                 AS "percent",
                                   ou_count."form_id"
                            FROM "iaso_orgunit" AS "root"
                                     LEFT OUTER JOIN (SELECT "iaso_orgunit"."path",
                                                             "iaso_form"."id"                         AS "form_id",
                                                             COUNT("iaso_instance"."id") FILTER
                                                                 (WHERE
                                                                     ("iaso_instance"."file" IS NOT NULL AND NOT "iaso_instance"."file" = '') AND
                                                                     NOT ("iaso_instance"."deleted")) AS "instances_count"
                                                      FROM "iaso_form"
                                                               JOIN "iaso_form_org_unit_types"
                                                                    ON "iaso_form"."id" = "iaso_form_org_unit_types"."form_id"
                                                               LEFT OUTER JOIN "iaso_orgunit"
                                                                               ON ("iaso_orgunit"."org_unit_type_id" =
                                                                                   "iaso_form_org_unit_types"."orgunittype_id")
                                                               LEFT OUTER JOIN "iaso_instance"
                                                                               ON ("iaso_orgunit"."id" =
                                                                                   "iaso_instance"."org_unit_id" AND
                                                                                   "iaso_form"."id" =
                                                                                   "iaso_instance"."form_id")
                                                      WHERE "iaso_form"."id" IN %(form_ids)s
                                                        AND "iaso_orgunit"."validation_status" IN ('VALID', 'NEW')
                                                      GROUP BY "iaso_orgunit"."path", "iaso_form"."id") ou_count
                                                     ON "root"."path" @> ou_count."path"
                            WHERE "root"."id" IN %(root_ids)s
                            GROUP BY "root"."id", ou_count."form_id"
                            ORDER BY "descendants" DESC) root_form ON ("iaso_form"."id" = root_form."form_id"
            AND "roots_to_pivot"."id" = root_form."org_unit_id")
        WHERE "iaso_form"."id" IN %(form_ids)s
          AND "roots_to_pivot"."id" = iaso_orgunit.id
        GROUP BY "roots_to_pivot"."id")
FROM iaso_orgunit 
--where id=1
ORDER BY id;"""
"""QUERY To get completness
take in parameters root_ids for the base orgunit and form_ids"""


class OrgUnitTypeSerializer(ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "depth"]


class CompletenessStatsV2ViewSet(viewsets.ViewSet):
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
        period = request.query_params.get("period", None)

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

        # Calculate the ou for which we want reporting `top_ous`
        org_units: OrgUnitQuerySet
        org_units = OrgUnit.objects.filter(version=version).filter(
            validation_status__in=(OrgUnit.VALIDATION_NEW, OrgUnit.VALIDATION_VALID)
        )

        # Filtering per org unit: we drop the rows that don't match the requested org_unit
        if requested_org_unit:
            org_units = org_units.hierarchy(requested_org_unit)

        # Filtering per parent org unit: we drop the rows that are not direct children of the requested parent org unit
        if requested_parent_org_unit:
            org_units = org_units.hierarchy(requested_parent_org_unit)
        else:
            # we want everything in the source, but we will filter for what the user has access too.
            if profile.org_units.all():
                # do the intersection
                roots = org_units.filter(id__in=profile.org_units.all())
                # take the whole hierarchy
                org_units = org_units.hierarchy(roots)

        # How we group them. If none we take the direct descendants
        if not requested_org_unit_types:
            if requested_parent_org_unit:
                top_ous = org_units.filter(parent=requested_parent_org_unit)
            elif profile.org_units.all():
                top_ous = org_units.filter(id__in=profile.org_units.all())
            else:
                top_ous = org_units.filter(parent=None)
        else:
            # org_units = org_units.hierarchy(requested_org_unit)
            top_ous = org_units.filter(org_unit_type__in=requested_org_unit_types)

        # Filtering by org unit type
        # if requested_org_unit_types is not None:
        #     This needs to be applied on the top_ous, not on the org_units (to act as a real filter, not something that changes the level of OUs in the table)
        #     top_ous = top_ous.filter(org_unit_type__id__in=[o.id for o in requested_org_unit_types])

        form_ids = tuple(list(form_qs.values_list("id", flat=True)))

        top_ous = top_ous.prefetch_related("org_unit_type", "parent")

        extra_params = (form_ids, form_ids)

        instance_args = ""
        if period:
            instance_args = 'AND "iaso_instance"."period" = %s'
            extra_params = (period,) + (form_ids, form_ids)

            print(top_ous)
        SUB_COMPLETENESS_QUERY = SUB_COMPLETENESS_QUERY_TEMPLATE.format(additional_instance_args=instance_args)
        ou_with_stats: QuerySet = top_ous.extra(
            select={"form_stats": SUB_COMPLETENESS_QUERY},
            select_params=extra_params,
        )

        def to_dict(row_ou):
            return {
                "name": row_ou.name,
                "id": row_ou.id,
                "org_unit": row_ou.as_dict_for_completeness_stats(),
                "form_stats": row_ou.form_stats,
                "org_unit_type": row_ou.org_unit_type.as_dict_for_completeness_stats(),
                "parent_org_unit": row_ou.parent.as_dict_for_completeness_stats() if row_ou.parent else None,
            }

        # return Response([to_dict(ou) for ou in ou_with_stats[:10]])

        # convert to proper pagination
        limit = int(request.GET.get("limit", 10))
        page_offset = int(request.GET.get("page", "1"))
        paginator = Paginator(ou_with_stats, limit)
        if page_offset > paginator.num_pages:
            page_offset = paginator.num_pages
        page = paginator.page(page_offset)

        # If a particular parent is requested we calcule it's own stats
        #  as it might be nice to display
        if requested_parent_org_unit:
            ou = requested_parent_org_unit
            form_stats_qs = form_qs.annotate(
                instance_count=Count(
                    expression=Subquery(
                        ou.instance_set.all()
                        .filter(~(Q(file="")))
                        .filter(form_id=OuterRef("id"))
                        .values("id")
                        .annotate(count=Func(F("id"), function="Count"))
                        .values("count")
                    )
                )
            ).prefetch_related("org_unit_types")
            request_parent_forms_stats = {
                f"form_{form.id}": {
                    "name": form.name,
                    "itself_target": ou.org_unit_type in form.org_unit_types.all(),
                    "itself_has_instances": form.instance_count > 0,
                    "itself_instances_count": form.instance_count,
                }
                for form in form_stats_qs
            }
        else:
            request_parent_forms_stats = {}

        object_list = [to_dict(ou) for ou in page.object_list]
        paginated_res = {
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
            "request_parent_forms_stats": request_parent_forms_stats,
        }

        return Response(paginated_res)

    @action(methods=["GET"], detail=False)
    def types_for_version_ou(self, request):
        "all the org unit type below this ou, or all"
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
