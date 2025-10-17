import re

from datetime import datetime

from django.contrib.gis.db.models import MultiPolygonField, PointField
from django.contrib.gis.geos import GEOSGeometry
from django.db.models import Case, Count, IntegerField, Q, QuerySet, Sum, When
from django.db.models.functions import Cast

from iaso.models import DataSource, Instance, OrgUnit


def apply_org_unit_search(queryset: QuerySet, value: str, prefix: str = "") -> QuerySet:
    if value.startswith("ids:"):
        s = value.replace("ids:", "")

        try:
            ids = re.findall("[A-Za-z0-9_-]+", s)
            queryset = queryset.filter(**{f"{prefix}id__in": ids})
        except:
            queryset = queryset.filter(**{f"{prefix}id__in": []})
            print("Failed parsing ids in search", value)
    elif value.startswith("refs:"):
        s = value.replace("refs:", "")
        try:
            # First, checking if there are any "fake"/"internal" external refs (e.g. 'iaso:123')
            internal_refs = re.findall(r"iaso:\d+", s)
            internal_refs_filter = Q()
            if internal_refs:
                iaso_ids = [int(i.split(":")[1]) for i in internal_refs]  # Split and parse ID
                kwargs = {
                    f"{prefix}id__in": iaso_ids,
                }
                internal_refs_filter = Q(**kwargs)
                s = re.sub(r"iaso:\d+", "", s)  # Remove internal refs to prevent them from breaking the other value

            # Then we can check real external refs
            refs = re.findall("[A-Za-z0-9_-]+", s)
            external_refs_filter = Q(**{f"{prefix}source_ref__in": refs})
            queryset = queryset.filter(external_refs_filter | internal_refs_filter)
        except:
            queryset = queryset.filter(**{f"{prefix}source_ref__in": []})
            print("Failed parsing refs in search", value)
    elif value.startswith("codes:"):
        s = value.replace("codes:", "")
        try:
            codes = re.findall("[A-Za-z0-9_-]+", s)
            queryset = queryset.filter(**{f"{prefix}code__in": codes})
        except:
            queryset = queryset.filter(**{f"{prefix}code__in": []})
            print("Failed parsing codes in search", value)
    else:
        queryset = queryset.filter(
            Q(**{f"{prefix}name__icontains": value}) | Q(**{f"{prefix}aliases__contains": [value]})
        )

    return queryset


def build_org_units_queryset(queryset, params, profile):
    validation_statuses = params.get("validation_status", OrgUnit.VALIDATION_VALID)
    has_instances = params.get("hasInstances", None)
    date_from = params.get("dateFrom", None)
    date_to = params.get("dateTo", None)
    search = params.get("search", None)

    org_unit_type_id = params.get("orgUnitTypeId", None)
    source_id = params.get("sourceId", None)
    with_shape = params.get("withShape", None)
    with_location = params.get("withLocation", None)
    geography = params.get("geography", None)
    parent_id = params.get("parent_id", None)
    source = params.get("source", None)
    project = params.get("project", None)
    group = params.get("group", None)
    version = params.get("version", None)
    default_version = params.get("defaultVersion", None)
    direct_children = params.get("onlyDirectChildren", None)
    direct_children = False if direct_children == "false" else True

    org_unit_parent_id = params.get("orgUnitParentId", None)
    org_unit_parent_ids = params.get("orgUnitParentIds", None)
    excluded_org_unit_parent_ids = params.get("excludedOrgUnitParentIds", None)

    linked_to = params.get("linkedTo", None)
    link_validated = params.get("linkValidated", True)
    link_source = params.get("linkSource", None)
    link_version = params.get("linkVersion", None)
    roots_for_user = params.get("rootsForUser", None)
    ignore_empty_names = params.get("ignoreEmptyNames", False)

    org_unit_type_category = params.get("orgUnitTypeCategory", None)
    path_depth = params.get("depth", None)

    date_open = params.get("date_open", None)
    opening_date = params.get("opening_date", None)
    closed_date = params.get("closed_date", None)

    if validation_statuses != "all":
        validation_statuses_list = validation_statuses.split(",")
        queryset = queryset.filter(validation_status__in=validation_statuses_list)

    if search:
        queryset = apply_org_unit_search(queryset, search)

    if group:
        if isinstance(group, str):
            group_ids = group.split(",")
        elif isinstance(group, int):
            group_ids = [group]
        else:
            group_ids = group
        queryset = queryset.filter(groups__in=group_ids).distinct()

    if source:
        source = DataSource.objects.get(id=source)
        if source.default_version:
            queryset = queryset.filter(version=source.default_version)
        else:
            queryset = queryset.filter(version__data_source_id=source)

    if project:
        queryset = queryset.filter(org_unit_type__projects__id=project)

    if version:
        queryset = queryset.filter(version=version)

    if default_version == "true" and profile is not None:
        queryset = queryset.filter(version=profile.account.default_version)

    if date_from is not None and date_to is None:
        queryset = queryset.filter(instance__created_at__gte=date_from)

    if date_from is None and date_to is not None:
        queryset = queryset.filter(instance__created_at__lte=date_to)

    if date_from is not None and date_to is not None:
        queryset = queryset.filter(instance__created_at__range=[date_from, date_to]).distinct()

    if has_instances is not None:
        if has_instances == "true":
            ids_with_instances = (
                Instance.objects.filter(org_unit__isnull=False)
                .exclude(file="")
                .exclude(deleted=True)
                .values_list("org_unit_id", flat=True)
            )
            queryset = queryset.filter(id__in=ids_with_instances)
        if has_instances == "false":
            ids_with_instances = (
                Instance.objects.filter(org_unit__isnull=False)
                .exclude(file="")
                .exclude(deleted=True)
                .values_list("org_unit_id", flat=True)
            )
            queryset = queryset.exclude(id__in=ids_with_instances)
        if has_instances == "duplicates":
            ids_with_duplicate_instances = (
                Instance.objects.with_status()
                .filter(org_unit__isnull=False, status=Instance.STATUS_DUPLICATED)
                .exclude(file="")
                .exclude(deleted=True)
                .values_list("org_unit_id", flat=True)
            )
            queryset = queryset.filter(id__in=ids_with_duplicate_instances)

    if org_unit_type_id:
        queryset = queryset.filter(org_unit_type__id__in=org_unit_type_id.split(","))

    # We need a few things for empty location comparisons:
    # 1. An annotated queryset (geography fields exposed as geometries)
    queryset = queryset.annotate(location_as_geom=Cast("location", PointField(dim=3)))
    queryset = queryset.annotate(simplified_geom_as_geom=Cast("simplified_geom", MultiPolygonField()))
    # 2. Empty features to compare to
    empty_point = GEOSGeometry("POINT EMPTY", srid=4326)
    empty_multipolygon = GEOSGeometry("MULTIPOLYGON EMPTY", srid=4326)

    has_location = Q(location__isnull=False) & (~Q(location_as_geom=empty_point))
    has_simplified_geom = Q(simplified_geom__isnull=False) & (~Q(simplified_geom_as_geom=empty_multipolygon))

    if geography == "location":
        queryset = queryset.filter(has_location)

    if geography == "shape":
        queryset = queryset.filter(has_simplified_geom)

    if geography == "none":
        queryset = queryset.filter(~has_location & ~has_simplified_geom)

    if geography == "any":
        queryset = queryset.filter(has_location | has_simplified_geom)

    if with_shape == "true":
        queryset = queryset.filter(has_simplified_geom)

    if with_shape == "false":
        queryset = queryset.filter(~has_simplified_geom)

    if with_location == "true":
        queryset = queryset.filter(has_location)

    if with_location == "false":
        queryset = queryset.filter(~has_location)

    if parent_id:
        if parent_id == "0":
            queryset = queryset.filter(parent__isnull=True)
        else:
            queryset = queryset.filter(parent__id=parent_id)

    if roots_for_user:
        if profile.org_units.all():
            queryset = queryset.filter(id__in=profile.org_units.all())
        else:
            queryset = queryset.filter(parent__isnull=True)

    if org_unit_parent_id:
        parent = OrgUnit.objects.get(id=org_unit_parent_id)
        queryset = queryset.hierarchy(parent)

    if org_unit_parent_ids:
        parent_ids = org_unit_parent_ids.split(",")
        parent = OrgUnit.objects.filter(id__in=parent_ids)
        queryset = queryset.hierarchy(parent)

    if excluded_org_unit_parent_ids:
        excluded_parent_ids = excluded_org_unit_parent_ids.split(",")
        excluded_parents = OrgUnit.objects.filter(id__in=excluded_parent_ids)
        # Get all org units in the hierarchy of the excluded parents
        excluded_hierarchy = OrgUnit.objects.hierarchy(excluded_parents)
        queryset = queryset.exclude(id__in=excluded_hierarchy.values_list("id", flat=True))

    if linked_to:
        is_destination = Q(destination_set__destination_id=linked_to)
        if link_validated != "all":
            is_destination &= Q(destination_set__validated=link_validated)
        is_source = Q(source_set__source_id=linked_to)
        if link_validated != "all":
            is_source &= Q(source_set__validated=link_validated)
        queryset = queryset.filter(is_source | is_destination)

        if link_source:
            queryset = queryset.filter(version__data_source_id=link_source)
        if link_version:
            queryset = queryset.filter(version_id=link_version)

    if source_id:
        queryset = queryset.filter(sub_source=source_id)

    if org_unit_type_category:
        queryset = queryset.filter(org_unit_type__category=org_unit_type_category.upper())

    if ignore_empty_names:
        queryset = queryset.filter(~Q(name=""))

    if path_depth is not None:
        queryset = queryset.filter(path__depth=path_depth)
    if date_open is not None:
        date = datetime.strptime(date_open, "%d-%m-%Y").date()
        queryset = queryset.filter(Q(opening_date__isnull=True) | Q(opening_date__lte=date)).filter(
            Q(closed_date__isnull=True) | Q(closed_date__gt=date)
        )
    if opening_date:
        queryset = queryset.filter(opening_date=datetime.strptime(opening_date, "%d-%m-%Y").date())
    if closed_date:
        queryset = queryset.filter(closed_date=datetime.strptime(closed_date, "%d-%m-%Y").date())
    if not direct_children:
        queryset = queryset.exclude(pk=org_unit_parent_id)

    queryset = queryset.select_related("version__data_source")
    queryset = queryset.select_related("org_unit_type")

    queryset = queryset.prefetch_related("groups")
    queryset = queryset.prefetch_related("parent__parent__parent__parent")
    queryset = queryset.prefetch_related("org_unit_type__projects")

    return queryset


def annotate_query(queryset, count_instances, count_per_form, forms):
    if count_instances:
        queryset = queryset.annotate(
            instances_count=Count(
                "instance",
                filter=(~Q(instance__file="") & ~Q(instance__device__test_device=True) & ~Q(instance__deleted=True)),
            )
        )

    if count_per_form:
        annotations = {
            f"form_{frm.id}_instances": Sum(
                Case(
                    When(
                        Q(instance__form_id=frm.id)
                        & ~Q(instance__file="")
                        & ~Q(instance__device__test_device=True)
                        & ~Q(instance__deleted=True),
                        then=1,
                    ),
                    default=0,
                    output_field=IntegerField(),
                )
            )
            for frm in forms
        }
        queryset = queryset.annotate(**annotations)

    return queryset
