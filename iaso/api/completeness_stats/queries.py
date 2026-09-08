"""Raw SQL (as CTEs) used to compute the completeness stats, and the queryset that wires them together."""

from django.db import models
from django.db.models import QuerySet
from django_cte import With
from django_cte.raw import raw_cte_sql

from iaso.models import Form, Instance, OrgUnit

from .serializers import OrgUnitWithFormStat


PIVOT_QUERY = """
    SELECT JSONB_OBJECT_AGG(
        'form_' || "iaso_form"."id", JSON_BUILD_OBJECT(
            'descendants', COALESCE(count_per_root."descendants", 0),
            'descendants_ok', COALESCE(count_per_root."descendants_ok", 0),
            'percent', COALESCE(count_per_root."percent", 0),
            'total_instances', COALESCE(count_per_root."total_instances", 0),
            'itself_target', COALESCE(count_per_root."itself_target", 0),
            'itself_has_instances', COALESCE(count_per_root."itself_has_instances", 0),
            'itself_instances_count', COALESCE(count_per_root."itself_instances_count", 0),
            'name', "iaso_form"."name",
            'id', "iaso_form"."id",
            'legend_threshold', "iaso_form"."legend_threshold"
        )
    ) AS "form_stats",
    filtered_roots.id AS org_unit_id
    FROM filtered_roots
    CROSS JOIN filtered_forms AS iaso_form
    LEFT OUTER JOIN "count_per_root" ON (
        count_per_root.form_id = iaso_form.id AND
        count_per_root.id = filtered_roots.id
    )
    GROUP BY filtered_roots.id
"""

OU_COUNT_QUERY = """
    SELECT "form_target_orgunit"."path",
        "form_target_orgunit"."form_id",
        COUNT("iaso_instance"."id") FILTER (
            WHERE ("iaso_instance"."file" IS NOT NULL AND NOT "iaso_instance"."file" = '')
            AND NOT ("iaso_instance"."deleted")
        ) AS "instances_count"
    FROM (
        -- An org unit is a target for a form either because its org unit type is one of the
        -- form's org unit types, or because it belongs to one of the form's org unit groups.
        -- The UNION (rather than UNION ALL) de-duplicates org units matched by both.
        --
        -- The two branches join against two DIFFERENT ctes -- "filtered_orgunit" and
        -- "filtered_orgunit_groups" -- that both wrap the exact same underlying queryset, rather
        -- than joining twice against the same cte. That's not a copy/paste artifact: Postgres only
        -- auto-inlines a CTE (letting it reuse the org_unit_type_id/id index of whichever join it's
        -- used in) when it's referenced exactly once; referenced from both UNION branches, it get
        -- materialized once via a sequential scan shared by both, which is an order of magnitude
        -- slower on large hierarchies. Giving each branch its own (identical) cte keeps each
        -- reference count at one, so each branch keeps its own cheap, index-driven access path.
        SELECT "iaso_orgunit"."id" AS "orgunit_id", "iaso_orgunit"."path", "iaso_form"."id" AS "form_id"
        FROM "filtered_forms" AS "iaso_form"
        JOIN "iaso_form_org_unit_types"
        ON "iaso_form"."id" = "iaso_form_org_unit_types"."form_id"
        JOIN "filtered_orgunit" AS "iaso_orgunit"
        ON ("iaso_orgunit"."org_unit_type_id" = "iaso_form_org_unit_types"."orgunittype_id")

        UNION

        SELECT "iaso_orgunit"."id" AS "orgunit_id", "iaso_orgunit"."path", "iaso_form"."id" AS "form_id"
        FROM "filtered_forms" AS "iaso_form"
        JOIN "iaso_form_org_unit_groups"
        ON "iaso_form"."id" = "iaso_form_org_unit_groups"."form_id"
        JOIN "iaso_group_org_units"
        ON "iaso_group_org_units"."group_id" = "iaso_form_org_unit_groups"."group_id"
        JOIN "filtered_orgunit_groups" AS "iaso_orgunit"
        ON ("iaso_orgunit"."id" = "iaso_group_org_units"."orgunit_id")
    ) AS "form_target_orgunit"
    LEFT OUTER JOIN "filtered_instance" AS "iaso_instance"
    ON ("form_target_orgunit"."orgunit_id" = "iaso_instance"."org_unit_id"
    AND "form_target_orgunit"."form_id" = "iaso_instance"."form_id")
    GROUP BY "form_target_orgunit"."path", "form_target_orgunit"."form_id"
    """

COUNT_PER_ROOT_QUERY = """
    SELECT root.id,
        "ou_count"."form_id",
        COUNT(ou_count.path) FILTER (WHERE "root"."path" != ou_count."path") AS "descendants",
        SUM(ou_count."instances_count") FILTER (WHERE "root"."path" != ou_count."path") AS "total_instances",
        COUNT(NULLIF(ou_count."instances_count", 0)) FILTER (WHERE "root"."path" != ou_count."path") AS "descendants_ok",
        (COUNT(NULLIF(ou_count."instances_count", 0)) FILTER (WHERE "root"."path" != ou_count."path")::float * 100 /
            NULLIF(COUNT(ou_count) FILTER (WHERE "root"."path" != ou_count."path"), 0)
        ) AS "percent",
        COUNT(NULLIF(ou_count."instances_count", 0)) FILTER (WHERE "root"."path" = ou_count."path") AS "itself_has_instances",
        SUM(ou_count."instances_count") FILTER (WHERE "root"."path" = ou_count."path") AS "itself_instances_count",
        COUNT(ou_count) FILTER (WHERE "root"."path" = ou_count."path") AS "itself_target"
    FROM filtered_roots AS root
    LEFT OUTER JOIN ou_count ON "root"."path" @> ou_count."path"
    GROUP BY root.id, ou_count.form_id
    """


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
    form_cte = With(form_qs.only("id", "name", "legend_threshold"), name="filtered_forms")
    instances_cte = With(instance_qs.only("id", "org_unit_id", "form_id", "file", "deleted"), name="filtered_instance")
    filter_ou_cte = With(orgunit_qs.only("id", "org_unit_type_id", "path"), name="filtered_orgunit")
    # Same underlying queryset as `filter_ou_cte`, given its own cte name so the org-unit-group
    # branch of OU_COUNT_QUERY doesn't share a reference with the org-unit-type branch -- see the
    # comment there for why that matters for the query plan.
    filter_ou_groups_cte = With(orgunit_qs.only("id", "org_unit_type_id", "path"), name="filtered_orgunit_groups")

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
        .with_cte(filter_ou_groups_cte)
        .annotate(form_stats=pivot_with.col.form_stats)
    )
    return annotated_query
