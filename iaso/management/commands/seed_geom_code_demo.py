"""
Helpers for `seed_test_data`'s geometry/code demo synchronization.

Builds a second datasource ("<name>_geom_demo") whose version 1 starts as an
identical copy of the real import, then applies a varied set of mutations
across small batches of org units so the resulting diff exercises every
synchronisable field combination:

  Scenario                              Geometry                      Other fields
  ─────────────────────────────────    ──────────────────────────    ──────────────────────────
  A: polygon shift + code               shift polygon                 code updated
  B: polygon shift + name               shift polygon                 name suffix
  C: polygon shift + code + opening_date shift polygon                 code updated, opening_date +1y
  C2: polygon shift only                shift polygon                 –
  D: new polygon + code                 point → polygon                code updated
  E: new polygon + closing_date         point → polygon                closing_date +1y
  F: code + name + opening_date         –                              code, name, opening_date
  G: name only                          –                              name suffix
  H: code only                          –                              code updated
  I: null -> new polygon                null → new polygon             –
  J: swapped codes (conflict)           –                              codes swapped between 2 org units

This simulates merging from multiple authoritative sources (DHIS2, EF, INS)
across datasource boundaries. Configure the sync with:
  source_version_to_update       = source_version   (the original DHIS2 import)
  source_version_to_compare_with = demo_version     (this source)
  field_names = [name, geometry, code, opening_date, closing_date]
"""

import json

from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon

from iaso.management.commands.command_logger import CommandLogger
from iaso.models import DataSource, DataSourceVersionsSynchronization, OrgUnit, SourceVersion


def _shift_geojson_coords(coords, dx, dy):
    if isinstance(coords[0], list):
        return [_shift_geojson_coords(c, dx, dy) for c in coords]
    return [coords[0] + dx, coords[1] + dy] + coords[2:]


def _mutate_shift_polygon(ou):
    """Shift the polygon by 0.1° (~11 km) and simplify it.

    The modest shift keeps old and new shapes overlapping (boundary-correction
    scenario) while aggressive simplification (0.05° tolerance) reduces the new
    shape to a handful of vertices, making the difference obvious on the map.
    """
    geojson = json.loads(ou.geom.geojson)
    geojson["coordinates"] = _shift_geojson_coords(geojson["coordinates"], dx=0.1, dy=0.1)
    shifted = GEOSGeometry(json.dumps(geojson), srid=4326)
    coarse = shifted.simplify(tolerance=0.05, preserve_topology=True)
    ou.geom = MultiPolygon(coarse, srid=4326) if coarse.geom_type == "Polygon" else coarse
    fine = ou.geom.simplify(tolerance=0.001, preserve_topology=True)
    ou.simplified_geom = MultiPolygon(fine, srid=4326) if fine.geom_type == "Polygon" else fine


def _make_square_polygon(cx, cy):
    size = 0.1  # ~10 km side — large enough to be unmistakably distinct from the original
    poly = Polygon(
        [
            (cx - size, cy - size),
            (cx + size, cy - size),
            (cx + size, cy + size),
            (cx - size, cy + size),
            (cx - size, cy - size),
        ],
        srid=4326,
    )
    geom = MultiPolygon(poly, srid=4326)
    simplified = geom.simplify(tolerance=0.001, preserve_topology=True)
    simplified_geom = MultiPolygon(simplified, srid=4326) if simplified.geom_type == "Polygon" else simplified
    return geom, simplified_geom


def _mutate_new_polygon_from_point(ou):
    """Replace the point location with a 1 km² polygon (point → polygon scenario).

    location is cleared so GeometryFieldType.access() returns the new polygon rather
    than the unchanged point — making the geometry change visible to the differ.
    """
    ou.geom, ou.simplified_geom = _make_square_polygon(ou.location.x, ou.location.y)
    ou.location = None


def _mutate_new_polygon_from_null(ou):
    """Add a polygon to an org unit that had no geometry at all (null → polygon scenario)."""
    # Use parent's centroid when available, otherwise fall back to a fixed coordinate
    # in the test data area.
    cx, cy = -11.0, 10.0
    if ou.parent:
        if ou.parent.geom:
            centroid = ou.parent.geom.centroid
            cx, cy = centroid.x, centroid.y
        elif ou.parent.location:
            cx, cy = ou.parent.location.x, ou.parent.location.y
    ou.geom, ou.simplified_geom = _make_square_polygon(cx, cy)


def _bump_date(d, years):
    """Return d shifted by the given number of years, or None if d is None."""
    if d is None:
        return None
    try:
        return d.replace(year=d.year + years)
    except ValueError:
        return d.replace(year=d.year + years, day=28)  # handle Feb-29


def _mutate_new_code(ou):
    ou.code = (ou.source_ref or ou.name[:8]) + "-v2"


def _mutate_name_suffix(ou):
    ou.name = ou.name + " (updated)"


def _mutate_opening_date_plus_1y(ou):
    ou.opening_date = _bump_date(ou.opening_date, 1)


def _mutate_closing_date_plus_1y(ou):
    ou.closed_date = _bump_date(ou.closed_date, 1)


SLICE = 5  # org units per mutation scenario

# label, pool, count, mutations applied in order — this table IS the field
# combination matrix described in the module docstring, kept in sync by
# construction instead of by hand.
MUTATION_SCENARIOS = [
    ("A: polygon shift + code", "geom", SLICE, [_mutate_shift_polygon, _mutate_new_code]),
    ("B: polygon shift + name", "geom", SLICE, [_mutate_shift_polygon, _mutate_name_suffix]),
    (
        "C: polygon shift + code + opening_date",
        "geom",
        SLICE,
        [_mutate_shift_polygon, _mutate_new_code, _mutate_opening_date_plus_1y],
    ),
    ("C2: polygon shift only", "geom", SLICE, [_mutate_shift_polygon]),
    ("D: new polygon + code", "point", SLICE, [_mutate_new_polygon_from_point, _mutate_new_code]),
    ("E: new polygon + closing_date", "point", SLICE, [_mutate_new_polygon_from_point, _mutate_closing_date_plus_1y]),
    (
        "F: code + name + opening_date",
        "remaining",
        SLICE,
        [_mutate_new_code, _mutate_name_suffix, _mutate_opening_date_plus_1y],
    ),
    ("G: name only", "remaining", SLICE, [_mutate_name_suffix]),
    ("H: code only", "remaining", SLICE, [_mutate_new_code]),
    ("I: null -> new polygon", "neither", 1, [_mutate_new_polygon_from_null]),
]
# J (swap codes between two demo org units) is pairwise, not per-unit — see
# apply_code_swap_conflict() below.


def create_demo_version(datasource):
    demo_datasource, _ = DataSource.objects.get_or_create(name=datasource.name + "_geom_demo")
    for project in datasource.projects.all():
        demo_datasource.projects.add(project)

    demo_version, _ = SourceVersion.objects.get_or_create(number=1, data_source=demo_datasource)

    # Wipe existing content for idempotency.
    deleted_count, _ = OrgUnit.objects.filter(version=demo_version).delete()
    if deleted_count:
        print(f"  Cleared {deleted_count} existing org units from demo version")

    return demo_datasource, demo_version


def copy_orgunits_to_demo_version(source_version, demo_version):
    # Copy every org unit from source_version to demo_version ordered by path so
    # parents are saved before children (save() uses the parent path to build the child's).
    source_orgunits = list(source_version.orgunit_set.select_related("parent", "org_unit_type").order_by("path"))

    v1_pk_to_v2 = {}
    for ou in source_orgunits:
        parent_v2 = v1_pk_to_v2.get(ou.parent_id) if ou.parent_id else None
        new_ou = OrgUnit(
            name=ou.name,
            source_ref=ou.source_ref,
            version=demo_version,
            org_unit_type=ou.org_unit_type,
            validation_status=ou.validation_status,
            parent=parent_v2,
            location=ou.location,
            geom=ou.geom,
            simplified_geom=ou.simplified_geom,
            code=ou.code,
            opening_date=ou.opening_date,
            closed_date=ou.closed_date,
        )
        new_ou.save()
        v1_pk_to_v2[ou.pk] = new_ou

    return v1_pk_to_v2


def apply_code_swap_conflict(demo_version):
    """Swap codes between two demo org units so each resulting change request tries to
    claim a code already held by the other's counterpart in source_version. Demo version
    stays internally consistent (no duplicate codes introduced), but approving either CR
    immediately collides with the existing holder in the target.
    """
    swap_pair = list(OrgUnit.objects.filter(version=demo_version).exclude(code="").order_by("name")[:2])
    if len(swap_pair) != 2:
        return []

    ou_a, ou_b = swap_pair
    code_a, code_b = ou_a.code, ou_b.code
    # Blank ou_a first to avoid a transient duplicate before ou_b is updated.
    ou_a.code = ""
    ou_a.save()
    ou_b.code = code_a
    ou_b.save()
    ou_a.code = code_b
    ou_a.save()
    return swap_pair


def apply_demo_mutations(demo_version):
    # Pools: org units that have a polygon vs those with only a point vs those with nothing.
    pools = {
        "geom": list(OrgUnit.objects.filter(version=demo_version, geom__isnull=False).order_by("name")),
        "point": list(
            OrgUnit.objects.filter(version=demo_version, location__isnull=False, geom__isnull=True).order_by("name")
        ),
        "neither": list(
            OrgUnit.objects.filter(version=demo_version, geom__isnull=True, location__isnull=True).order_by("name")
        ),
    }

    def take(pool_key, n):
        # Slices F-H don't require a specific geometry type; use whatever pool still has items.
        pool = pools["point"] if pool_key == "remaining" and pools["point"] else pools.get(pool_key, pools["geom"])
        taken, pool[:] = pool[:n], pool[n:]
        return taken

    stats = {}
    for label, pool_key, count, mutations in MUTATION_SCENARIOS:
        batch = take(pool_key, count)
        for ou in batch:
            for mutate in mutations:
                mutate(ou)
            ou.save()
        stats[label] = (len(batch), [ou.name for ou in batch[:2]])

    swapped_pair = apply_code_swap_conflict(demo_version)
    stats["J: swapped codes (conflict)"] = (len(swapped_pair), [ou.name for ou in swapped_pair[:2]])

    return stats, swapped_pair


def print_mutation_summary(demo_datasource, demo_version, stats):
    total = sum(count for count, _ in stats.values())
    print(f"  Applied mutations to {total} org units:")
    for label, (count, samples) in stats.items():
        sample_str = ", ".join(f'"{n}"' for n in samples)
        print(f"    {label}: {count}  (e.g. {sample_str})")
    print(f"  Demo datasource: '{demo_datasource.name}' (version {demo_version.number})")


def run_demo_sync_and_report(datasource, source_version, demo_version, swapped_pair, created_by, stdout):
    print("********* creating geom/code demo synchronization")

    account = datasource.projects.first().account

    # Wipe any previous sync between these two versions so the seed is idempotent.
    DataSourceVersionsSynchronization.objects.filter(
        source_version_to_update=source_version,
        source_version_to_compare_with=demo_version,
        account=account,
    ).delete()

    sync = DataSourceVersionsSynchronization.objects.create(
        name="geom_code_demo_sync",
        source_version_to_update=source_version,
        source_version_to_compare_with=demo_version,
        account=account,
        created_by=created_by,
    )

    field_names = ["name", "geometry", "code", "opening_date", "closed_date"]
    sync.create_json_diff(field_names=field_names, logger_to_use=CommandLogger(stdout))
    print(f"  Diff computed: {sync.count_update} updates, {sync.count_create} creations")

    sync.synchronize_source_versions()
    cr_count = sync.change_requests.count()
    geom_cr_count = sync.change_requests.exclude(new_geom=None).count()
    print(f"  Change requests created: {cr_count} total, {geom_cr_count} with geometry change")

    print_demo_sync_urls(sync, account, source_version, swapped_pair)


def print_demo_sync_urls(sync, account, source_version, swapped_pair):
    domain = settings.DNS_DOMAIN
    scheme = "http" if domain.startswith("localhost") else "https"
    base = f"{scheme}://{domain}/dashboard/validation/changeRequest"

    url = f"{base}/accountId/{account.id}/data_source_synchronization_id/{sync.id}/source_version_id/{source_version.id}/page/1"
    print(f"  Review change requests: {url}")

    # Log a sample CR with geometry change so the user can jump straight to the detail view.
    sample_geom_cr = sync.change_requests.exclude(new_geom=None).first()
    if sample_geom_cr:
        detail_url = f"{base}/detail/accountId/{account.id}/changeRequestId/{sample_geom_cr.id}"
        print(f"  Sample geometry change request: {detail_url}  ({sample_geom_cr.org_unit.name})")

    # Log the swapped-code CRs: approving either would collide with the other's existing code.
    if swapped_pair:
        swap_refs = [ou.source_ref for ou in swapped_pair if ou.source_ref]
        conflict_crs = list(sync.change_requests.filter(org_unit__source_ref__in=swap_refs))
        if conflict_crs:
            print("  Swapped-code conflict — approving either CR collides with the other's existing code:")
            for cr in conflict_crs:
                cr_detail_url = f"{base}/detail/accountId/{account.id}/changeRequestId/{cr.id}"
                print(f"    {cr_detail_url}  ({cr.org_unit.name}  new_code={cr.new_code})")
