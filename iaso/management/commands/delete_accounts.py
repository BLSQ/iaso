"""
FK-graph-based account deletion.

Core idea: instead of manually listing every model to delete, we traverse
Django's FK metadata (Model._meta.related_objects) from Account via BFS to
auto-discover related models and build their deletion filter path.  A
topological sort then gives the correct deletion order.

What is automatic:
  - ~100 models discovered and deleted without any manual listing
  - Plugin models (polio, wfp, …) included automatically
  - New models added in future are picked up on next run
  - Deletion order computed from FK constraints (no more ProtectedError
    from cascade chains between discovered models)

What still needs manual code (M2M gap):
  - DataSource / SourceVersion / OrgUnit — linked to Account via
    Project.data_sources M2M, not a direct FK; the BFS path via credentials
    is SET_NULL and therefore partial
  - Form — linked via projects M2M
  - Orphan audit/export log cleanup (content-type based, not FK based)

Usage:
  docker compose run --rm iaso manage delete_accounts --account-to-keep 1
  docker compose run --rm iaso manage delete_accounts --account-to-keep 1 --dry-run
  docker compose run --rm iaso manage delete_accounts --show-graph


how to test this crazyness

launch the seed commands for different versions
    docker compose run --rm iaso manage seed_test_data --mode=seed --dhis2version=2.40.10
    docker compose run --rm iaso manage seed_test_data --mode=seed --dhis2version=2.42.3.1
    docker compose run --rm iaso manage seed_test_data --mode=seed --dhis2version=2.42.3.1

this clearly won't reproduce all potential issues in like in production (seed gives low volumes, good data quality)

then launch the delete command with appropriate account to delete (or don't specify it a list will be displayed)

    docker compose run --rm iaso manage delete_accounts --account-to-keep 1


"""

import datetime
import random
import time
import traceback

from collections import defaultdict, deque
from contextlib import contextmanager
from graphlib import TopologicalSorter

import django

from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.sessions.models import Session
from django.core.management.base import BaseCommand
from django.db import connection
from django.db.models import ForeignKey, ManyToManyRel, OneToOneField, TextField
from django.db.models.deletion import SET_NULL, Collector, ProtectedError
from django.db.models.functions import Cast

from hat.audit.models import Modification
from iaso.models import (
    Account,
    CommentIaso,
    Form,
    OrgUnitType,
    Task,
)
from iaso.models.base import KILLED, QUEUED, DataSource, ExternalCredentials, Profile
from iaso.models.device import Device
from iaso.models.entity import Entity
from iaso.models.instances import Instance, InstanceFile
from iaso.models.microplanning import Planning, PlanningSamplingResult
from iaso.models.org_unit import OrgUnit
from iaso.models.project import Project


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------


def _log(msg):
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {msg}")


# ---------------------------------------------------------------------------
# Streaming chunked delete
# ---------------------------------------------------------------------------


def _chunked_delete(queryset, chunk_size=5000, label=None):
    """Delete in streaming chunks — never loads more than chunk_size PKs at once."""
    model = queryset.model
    label = label or model.__name__
    total = 0
    t0 = time.monotonic()

    while True:
        ids = list(queryset.order_by("pk").values_list("pk", flat=True)[:chunk_size])
        if not ids:
            break
        chunk_qs = queryset.filter(pk__in=ids)
        try:
            deleted = chunk_qs._raw_delete(using=queryset.db)
        except Exception as exc:
            _log(f"  {label}: _raw_delete failed ({exc!r}), falling back to .delete()")
            _, counts = chunk_qs.delete()
            deleted = counts.get(model._meta.label, 0)
            counts_str = ", ".join(f"{k}: {v}" for k, v in sorted(counts.items()) if v)
            _log(f"  {label}: cascade counts: {counts_str}")
        total += deleted

    return total


# ---------------------------------------------------------------------------
# FK graph — discovery and topological sort
# ---------------------------------------------------------------------------

# Only follow FK edges to models from these app module prefixes.
# "iaso" covers the main app; "plugins" covers all plugin apps (polio, etc.).
# Third-party app models (django_sql_dashboard, auth, etc.) are skipped — Django
# CASCADE handles them automatically when their parent rows disappear.
_PROJECT_APP_PREFIXES = ("iaso", "plugins")

# Models discovered via a SET_NULL path — filter may miss rows where FK is NULL.
# These are flagged as "partial coverage" in --show-graph.
_PARTIAL_COVERAGE_NOTE = "⚠ partial: SET_NULL path, rows with NULL FK are missed"


def _is_project_model(model):
    """True if this model belongs to iaso or a plugin (not a third-party or Django built-in app)."""
    app_module = model._meta.app_config.__class__.__module__
    return app_module.startswith(_PROJECT_APP_PREFIXES)


def build_fk_graph(root_model):
    """
    BFS from root_model through reverse FK relations.

    Returns:
      discovered : {model: (filter_kwarg, on_delete_name, is_partial)}
        filter_kwarg — Django ORM lookup, e.g. 'project__account'
        on_delete_name — on_delete of the edge that discovered this model
        is_partial — True if any edge on the path is SET_NULL (nullable FK)
      graph_edges : list of (child_model, parent_model, on_delete_name)
        Directed edges from FK holder → FK target (used for topo sort)
    """
    discovered = {}  # model → (filter_kwarg, on_delete_name, is_partial)
    graph_edges = []

    visited = {root_model: (None, False)}  # model → (filter_kwarg, is_partial)
    queue = deque([(root_model, None, False)])

    while queue:
        current, current_filter, current_partial = queue.popleft()

        for rel in current._meta.related_objects:
            if isinstance(rel, ManyToManyRel):
                continue

            child = rel.related_model
            if child in visited:
                continue
            if getattr(child._meta, "abstract", False) or getattr(child._meta, "swapped", None):
                continue
            if not _is_project_model(child):
                continue

            field_name = rel.field.name
            new_filter = field_name if current_filter is None else f"{field_name}__{current_filter}"
            od_name = getattr(rel.on_delete, "__name__", str(rel.on_delete))
            is_partial = current_partial or (rel.on_delete is SET_NULL)

            visited[child] = (new_filter, is_partial)
            discovered[child] = (new_filter, od_name, is_partial)
            queue.append((child, new_filter, is_partial))

    # Collect cross-edges between discovered models (for topo sort)
    for model in discovered:
        for field in model._meta.get_fields():
            if not isinstance(field, (ForeignKey, OneToOneField)):
                continue
            target = field.related_model
            if target not in discovered or target is model:
                continue
            od_name = getattr(field.remote_field.on_delete, "__name__", "?")
            graph_edges.append((model, target, od_name))

    return discovered, graph_edges


def topo_sort_deletion_order(discovered, graph_edges):
    """
    Topological sort: model A before model B if A has a CASCADE or PROTECT FK to B
    (A must be deleted first to avoid blocking B's deletion).

    SET_NULL and DO_NOTHING edges don't impose ordering (handled by breaking cycles
    before deletion or nulling out before the batch delete runs).

    Uses graphlib.TopologicalSorter (Python 3.9+).
    Falls back gracefully if cycles remain after filtering.
    """
    ts = TopologicalSorter()

    for model in discovered:
        ts.add(model)

    for child, parent, od_name in graph_edges:
        if od_name in ("CASCADE", "PROTECT"):
            # child must be deleted BEFORE parent
            # ts.add(X, Y) means Y must come before X
            ts.add(parent, child)

    try:
        return list(ts.static_order())
    except Exception as exc:
        _log(f"  [topo sort] cycle detected ({exc}), falling back to reverse-BFS order")
        return list(reversed(list(discovered.keys())))


# ---------------------------------------------------------------------------
# Graph-based deletion engine
# ---------------------------------------------------------------------------


def execute_graph_deletion(discovered, deletion_order, account, chunk_size, dry_run, skip_models=None):
    """
    Delete all discovered models in topological order.
    Each model's rows are filtered using the auto-built filter_kwarg.
    skip_models: set of model classes handled manually (excluded from this step).
    """
    skip_models = skip_models or set()
    models_processed = 0
    models_with_rows = 0
    total_deleted = 0

    for model in deletion_order:
        if model not in discovered or model in skip_models:
            continue
        filter_kwarg, od_name, is_partial = discovered[model]
        manager = getattr(model, "objects_include_deleted", model._default_manager)

        try:
            qs = manager.filter(**{filter_kwarg: account})
        except Exception as exc:
            _log(f"  [skip] {model.__name__}: cannot build queryset ({exc})")
            continue

        models_processed += 1
        label = f"{model.__name__}[{filter_kwarg}]"
        if is_partial:
            label += " ⚠ partial"

        if dry_run:
            _log(f"  [DRY RUN] would delete {label}")
            continue

        n = 0
        for attempt in range(5):
            try:
                n += _chunked_delete(qs, chunk_size, label=label)
                break
            except ProtectedError as exc:
                # Auto-clear blocking objects (e.g. nullable PROTECT FKs from partial-coverage models)
                by_model = defaultdict(list)
                for obj in exc.protected_objects:
                    by_model[type(obj)].append(obj.pk)
                for blocker_model, pks in by_model.items():
                    _log(f"  [auto-unblock] {blocker_model.__name__} ×{len(pks)} blocking {label}")
                    _chunked_delete(
                        blocker_model.objects.filter(pk__in=pks), chunk_size, f"{blocker_model.__name__}[unblock]"
                    )

        if n:
            _log(f"  {label}: {n:,} deleted")
        if n:
            models_with_rows += 1
            total_deleted += n

    if not dry_run:
        _log(
            f"  topo step: {models_processed} models processed, {models_with_rows} non-empty, {total_deleted:,} rows deleted total"
        )


# ---------------------------------------------------------------------------
# --show-graph mode
# ---------------------------------------------------------------------------


def show_graph(discovered, graph_edges, deletion_order, account=None):
    """
    Print what the FK graph discovered, flag partial-coverage paths,
    and optionally show which discovered models have data for the account.
    """
    _log(f"=== FK Graph from Account — {len(discovered)} models discovered ===")
    _log("")
    _log(f"{'Model':55s} {'on_delete':12s} {'filter path'}")
    _log("-" * 120)

    for model in deletion_order:
        if model not in discovered:
            continue
        filter_kwarg, od_name, is_partial = discovered[model]
        flag = "⚠" if is_partial else " "
        count_str = ""
        if account is not None:
            try:
                manager = getattr(model, "objects_include_deleted", model._default_manager)
                count = manager.filter(**{filter_kwarg: account}).count()
                count_str = f"  [{count} rows]"
            except Exception:
                count_str = "  [?]"
        _log(f"  {flag} {model._meta.label:53s} {od_name:12s}  {filter_kwarg}{count_str}")

    _log("")
    _log("⚠ = path contains a SET_NULL FK — rows where that FK is NULL are NOT found by this filter")
    _log("    These models need manual handling or supplementary filters.")
    _log("")

    # Models NOT discovered (manual handling required)
    manual = [
        (
            "iaso.DataSource / SourceVersion / OrgUnit",
            "linked via Project.data_sources M2M, BFS only finds those with credentials",
        ),
        ("iaso.Form", "linked via projects M2M"),
        ("audit.Modification", "content-type based, no FK to Account"),
        ("iaso.ExportLog", "no FK to Account"),
        ("django_sql_dashboard.Dashboard", "no FK to Account"),
        ("django.contrib.sessions.Session", "no FK to Account"),
        ("vector_control_apiimport", "raw SQL table, not a Django model"),
        ("users_profile", "legacy raw SQL table"),
    ]
    _log("=== Models NOT in FK graph (manual handling required) ===")
    for label, reason in manual:
        _log(f"  - {label}")
        _log(f"      reason: {reason}")


# ---------------------------------------------------------------------------
# Management command
# ---------------------------------------------------------------------------


class Command(BaseCommand):
    help = "FK-graph-based account deletion — auto-discovers related models"

    def add_arguments(self, parser):
        mode = parser.add_mutually_exclusive_group(required=True)
        mode.add_argument("--account-to-keep", type=int, metavar="ID")
        mode.add_argument(
            "--account-to-delete",
            type=int,
            action="append",
            dest="accounts_to_delete",
            metavar="ID",
        )
        mode.add_argument(
            "--show-graph",
            action="store_true",
            help="Print the FK discovery graph and exit (use with --for-account to show row counts)",
        )
        mode.add_argument(
            "--list-accounts",
            action="store_true",
            help="List all accounts with their IDs and exit",
        )
        parser.add_argument("--for-account", type=int, metavar="ID", help="Account to count rows for with --show-graph")
        parser.add_argument("--chunk-size", type=int, default=5000)
        parser.add_argument("--dry-run", action="store_true")

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------

    def _sql(self, sql, params=None, label="SQL"):
        if self.dry_run:
            _log(f"  [DRY RUN] {label}: {sql[:100]}")
            return 0
        if params:
            self.cursor.execute(sql, params)
        else:
            self.cursor.execute(sql)
        n = self.cursor.rowcount
        if n:
            _log(f"  {label}: {n:,} deleted")
        return n

    def _delete_qs(self, queryset, label=None):
        label = label or queryset.model.__name__
        if self.dry_run:
            _log(f"  [DRY RUN] {label}: ~{queryset.count()}")
            return
        n, _ = queryset.delete()
        _log(f"  {label}: {n} deleted")

    @contextmanager
    def _doing(self, step):
        """Context manager: logs current step; re-raises with context on error."""
        self._current_step = step
        try:
            yield
        except Exception as exc:
            raise RuntimeError(f"[step: {step}] {exc}") from exc

    # -----------------------------------------------------------------------
    # Manual section: DataSource / SourceVersion / OrgUnit
    # These are M2M-linked (Project.data_sources); the FK graph only finds
    # DataSources that have credentials, so we handle the full set here.
    # -----------------------------------------------------------------------

    def _cascade_chunked_delete(self, queryset, label):
        """
        Drop-in replacement for queryset.delete() that:
        - Uses Django's Collector to discover the full cascade (respects model evolution)
        - Logs each model being deleted with its count
        - Deletes in chunks instead of one giant transaction
        For models without signals (most iaso models), Collector stores querysets in
        fast_deletes — no instances are loaded into memory.
        """

        for attempt in range(10):
            collector = Collector(using=queryset.db)
            try:
                collector.collect(queryset)
                break
            except ProtectedError as exc:
                by_model = defaultdict(list)
                for obj in exc.protected_objects:
                    by_model[type(obj)].append(obj.pk)
                for blocker_model, pks in by_model.items():
                    _log(f"  [auto-unblock] {blocker_model.__name__} ×{len(pks)} blocking {label} (collect phase)")
                    _chunked_delete(
                        blocker_model.objects.filter(pk__in=pks), self.chunk_size, f"{blocker_model.__name__}[unblock]"
                    )
        else:
            raise RuntimeError(f"Could not collect {label} after 10 attempts — PROTECT cycle not resolved")

        collector.sort()

        # Build a unified deletion plan from both fast_deletes (querysets) and
        # data (instance dicts). Topo-sort them together so FK holders are always
        # deleted before the models they reference, regardless of which list they
        # came from.
        plan_items = []  # list of (model, queryset_or_None, pk_list_or_None)
        for qs in collector.fast_deletes:
            plan_items.append((qs.model, qs, None))
        for model, instances in collector.data.items():
            pks = [obj.pk for obj in instances]
            if pks:
                plan_items.append((model, None, pks))

        # Topo sort via Kahn's algorithm: if model A has a FK to model B, delete A first.
        # Use _meta.local_fields (forward FK/O2O only) — _meta.get_fields() also returns
        # reverse relations which would flip the dependency direction and break the sort.
        # Kahn's algorithm handles cycles gracefully: cycle participants are appended at the
        # end in plan_items insertion order (fast_deletes before data, so SourceVersion before
        # DataSource). DataSource.default_version is already nulled, so either order is safe.
        # plan_models as dict preserves insertion order for cycle-node fallback.
        plan_models = dict.fromkeys(m for m, _, _ in plan_items)
        successors = {m: set() for m in plan_models}
        in_degree = {m: 0 for m in plan_models}
        for model in plan_models:
            for field in model._meta.local_fields:
                if isinstance(field, (ForeignKey, OneToOneField)):
                    # Skip SET_NULL FKs: they don't create a hard ordering constraint
                    # (the DB will null them on parent deletion, or we've already done so).
                    # Including them creates false cycles (e.g. DataSource.default_version
                    # ↔ SourceVersion.data_source).
                    if field.remote_field.on_delete is SET_NULL:
                        continue
                    target = field.related_model
                    if target and target in plan_models and target is not model:
                        # model holds FK → delete model first → target depends on model
                        if target not in successors[model]:  # deduplicate before incrementing
                            successors[model].add(target)
                            in_degree[target] += 1
        queue = [m for m in plan_models if in_degree[m] == 0]
        ordered_models = []
        while queue:
            m = queue.pop(0)
            ordered_models.append(m)
            for s in successors[m]:
                in_degree[s] -= 1
                if in_degree[s] == 0:
                    queue.append(s)
        # Append cycle participants at the end in their original insertion order
        cycle_nodes = [m for m in plan_models if m not in set(ordered_models)]
        if cycle_nodes:
            _log(f"  {label}: topo-sort cycle (ignored): {[m.__name__ for m in cycle_nodes]}")
        ordered_models.extend(cycle_nodes)

        model_to_item = {m: (qs, pks) for m, qs, pks in plan_items}
        ordered_items = [(m, *model_to_item[m]) for m in ordered_models if m in model_to_item]

        if plan_items:
            _log(f"  {label}: cascade plan — {', '.join(sorted(m._meta.label for m, _, _ in plan_items))}")

        total_steps = len(ordered_items)
        for step, (model, qs, pks) in enumerate(ordered_items, 1):
            lbl = f"{label}→{model._meta.label}"
            _log(f"  [{step}/{total_steps}] {lbl}…")
            t0 = time.monotonic()
            if qs is not None:
                n = qs._raw_delete(using=qs.db)
            else:
                n = 0
                for i in range(0, len(pks), self.chunk_size):
                    chunk = pks[i : i + self.chunk_size]
                    n += model.objects.filter(pk__in=chunk)._raw_delete(using=queryset.db)
            if n:
                _log(f"  {lbl}: {n:,} deleted ({time.monotonic() - t0:.1f}s)")

    def _delete_datasource_tree(self, datasources, label_prefix=""):
        """Delete each DataSource fully before moving to the next."""
        ds_list = datasources if isinstance(datasources, list) else list(datasources)
        _log(f"  Deleting {len(ds_list)} datasource(s)")

        for ds in ds_list:
            lbl = f"{label_prefix}ds[{ds.id}]"
            versions_qs = ds.versions.all()
            instances_in_ds = Instance.objects.filter(org_unit__version__in=versions_qs)
            entities_qs = Entity.objects_include_deleted.filter(attributes__in=instances_in_ds)

            with self._doing(f"Entity {lbl}"):
                # Instance.entity is DO_NOTHING — PostgreSQL still enforces the FK.
                # Null it out before deleting Entity to avoid IntegrityError.
                if not self.dry_run:
                    Instance.objects.filter(entity__in=entities_qs).update(entity=None)
                self._delete_qs(entities_qs, label=f"Entity[{lbl}]")

            with self._doing(f"InstanceFile {lbl}"):
                self._delete_qs(
                    InstanceFile.objects.filter(instance__in=instances_in_ds),
                    label=f"InstanceFile[{lbl}]",
                )

            with self._doing(f"Instance {lbl}"):
                if not self.dry_run:
                    _chunked_delete(instances_in_ds, self.chunk_size, f"Instance[{lbl}]")

            # Planning.org_unit = PROTECT blocks OrgUnit deletion (hence DataSource cascade).
            # Cycle: Planning.selected_sampling_result = PROTECT(PSR) ↔ PSR.planning = CASCADE(Planning)
            # Break it: null Planning.selected_sampling_result → delete PSR → delete Planning.
            with self._doing(f"Planning/PSR cycle {lbl}"):
                if not self.dry_run:
                    planning_qs = Planning.objects.filter(org_unit__version__in=versions_qs)
                    planning_qs.update(selected_sampling_result=None)
                    _chunked_delete(
                        PlanningSamplingResult.objects.filter(planning__in=planning_qs),
                        self.chunk_size,
                        f"PlanningSamplingResult[{lbl}]",
                    )
                    _chunked_delete(planning_qs, self.chunk_size, f"Planning[{lbl}]")

            if not self.dry_run:
                with self._doing(f"DataSource cascade {lbl}"):
                    # DataSource.default_version → SourceVersion cycle: null first.
                    DataSource.objects.filter(pk=ds.pk).update(default_version=None)
                    # OrgUnit.parent is a self-referential FK; batch _raw_delete fails if any
                    # row's parent is another row in the same batch. Null all within this
                    # datasource's versions before the cascade reaches OrgUnit.
                    OrgUnit.objects.filter(version__in=versions_qs).update(parent=None)
                    self._cascade_chunked_delete(DataSource.objects.filter(pk=ds.pk), lbl)
            else:
                _log(f"  [DRY RUN] {lbl}: would cascade-delete DataSource → SourceVersion → OrgUnit → …")

    # -----------------------------------------------------------------------
    # Manual section: Form (M2M-linked)
    # -----------------------------------------------------------------------

    def _delete_forms(self, account):
        forms = Form.objects_include_deleted.filter(projects__account=account)
        with self._doing(f"Form account={account.id}"):
            self._delete_qs(forms, label="Form")

    # -----------------------------------------------------------------------
    # Manual section: User / Profile
    # Profile.user is a forward FK (Profile → User); User is upstream so not
    # in the BFS reverse graph.  We collect user_ids from profiles and delete.
    # -----------------------------------------------------------------------

    def _delete_users(self, account, profiles):
        user_ids = list(profiles.values_list("user_id", flat=True))
        users = User.objects.filter(pk__in=user_ids)
        with self._doing(f"User account={account.id}"):
            self._delete_qs(users, label="User")

    # -----------------------------------------------------------------------
    # Pre/post-flight cleanup
    # -----------------------------------------------------------------------

    def _pre_flight(self):
        try:
            self._sql("DELETE FROM users_profile", label="users_profile")
        except django.db.utils.ProgrammingError:
            pass
        self._sql("DELETE FROM vector_control_apiimport", label="vector_control_apiimport")

        # Instances with no form (PROTECT FK — must go before any Form cleanup)
        no_form = Instance.objects.filter(form=None)
        self._delete_qs(InstanceFile.objects.filter(instance__in=no_form), label="InstanceFile[no form]")
        self._delete_qs(no_form, label="Instance[no form]")

        # OrgUnits with no version: null self-ref parent first, then delete instances/files
        # that reference them (DO_NOTHING FK — DB enforces NO ACTION so must be cleared first)
        no_version_ou = OrgUnit.objects.filter(version=None)
        if not self.dry_run:
            no_version_ou.update(parent=None)  # break self-ref tree
        no_version_instances = Instance.objects.filter(org_unit__in=no_version_ou)
        self._delete_qs(
            InstanceFile.objects.filter(instance__in=no_version_instances), label="InstanceFile[ou no version]"
        )
        self._delete_qs(no_version_instances, label="Instance[ou no version]")
        self._delete_qs(no_version_ou, label="OrgUnit[no version]")

        orphans = Instance.objects.filter(project=None, form=None, org_unit=None)
        self._delete_qs(InstanceFile.objects.filter(instance__in=orphans), label="InstanceFile[orphan]")
        self._delete_qs(orphans, label="Instance[orphan]")

        if not self.dry_run:
            Task.objects.filter(status=QUEUED).update(status=KILLED)
            _log("  Queued tasks killed")

    def _post_flight(self, account_to_keep):
        # Orphan datasources — delete one by one, continue on error
        ds_ids_to_keep = DataSource.objects.filter(projects__account=account_to_keep).values_list("id", flat=True)
        orphan_ds = list(DataSource.objects.exclude(id__in=ds_ids_to_keep))
        _log(f"Orphan datasources: {len(orphan_ds)}")
        for ds in orphan_ds:
            try:
                self._delete_datasource_tree([ds])
            except Exception as exc:
                _log(f"  [error] orphan ds[{ds.id}] {ds.name!r}: {exc} — skipping")

        # Forms without projects
        forms_no_project = Form.objects_include_deleted.filter(projects=None)
        self._delete_qs(
            InstanceFile.objects.filter(instance__in=Instance.objects.filter(form__in=forms_no_project)),
            label="InstanceFile[form no project]",
        )
        self._delete_qs(Instance.objects.filter(form__in=forms_no_project), label="Instance[form no project]")

        self._delete_qs(Project.objects.filter(account=None), label="Project[no account]")
        # Forms with no form_id may still have instances (not covered by the forms_no_project cleanup above).
        forms_no_form_id = Form.objects_include_deleted.filter(form_id=None)
        self._delete_qs(
            InstanceFile.objects.filter(instance__in=Instance.objects.filter(form__in=forms_no_form_id)),
            label="InstanceFile[form no form_id]",
        )
        self._delete_qs(Instance.objects.filter(form__in=forms_no_form_id), label="Instance[form no form_id]")
        self._delete_qs(forms_no_form_id, label="Form[no form_id]")
        self._delete_qs(Session.objects.all(), label="Session")
        self._delete_qs(Device.objects.filter(projects=None), label="Device[orphan]")

        for f in forms_no_project:
            try:
                if not self.dry_run:
                    OrgUnitType.reference_forms.through.objects.filter(form=f).delete()
                    f.org_unit_types.clear()
                    InstanceFile.objects.filter(instance__form_version__in=f.form_versions.all()).delete()
                    Instance.objects.filter(form_version__in=f.form_versions.all()).delete()
                    f.delete_hard()
            except Exception:
                _log(traceback.format_exc())

        try:
            from django_sql_dashboard.models import Dashboard

            self._delete_qs(Dashboard.objects.all(), label="Dashboard")
        except (ImportError, RuntimeError):
            # RuntimeError when django_sql_dashboard is installed but not in INSTALLED_APPS
            pass
        self._sql(
            "DELETE FROM iaso_exportrequest WHERE id NOT IN (SELECT DISTINCT export_request_id FROM iaso_exportstatus)",
            label="iaso_exportrequest[orphan]",
        )
        self._cleanup_modification_logs()
        self._cleanup_export_logs()

    def _cleanup_modification_logs(self):
        _log("Cleaning modification logs...")
        if not self.dry_run:
            self.cursor.execute("SET work_mem = '1GB'")

        instance_ct = ContentType.objects.get_by_natural_key(app_label="iaso", model="instance")
        sql = (
            "WITH cte AS ("
            f" SELECT id FROM audit_modification WHERE content_type_id = {instance_ct.id}"
            "  AND object_id NOT IN (SELECT CAST(id AS text) FROM iaso_instance)"
            "  ORDER BY id LIMIT 20000"
            ") DELETE FROM audit_modification WHERE id IN (SELECT id FROM cte)"
        )
        for i in range(2000):
            if self.dry_run:
                break
            self.cursor.execute(sql)
            _log(f"  Modification batch {i}: {self.cursor.rowcount} deleted")
            if self.cursor.rowcount == 0:
                break

        for model_cls, app_label, model_name in [
            (Instance, "iaso", "instance"),
            (Form, "iaso", "form"),
            (OrgUnit, "iaso", "orgunit"),
        ]:
            ct = ContentType.objects.get_by_natural_key(app_label=app_label, model=model_name)
            surviving = model_cls.objects.annotate(id_as_str=Cast("id", TextField())).values("id_as_str")
            self._delete_qs(
                Modification.objects.filter(content_type=ct).exclude(object_id__in=surviving),
                label=f"Modification[{model_name} orphan]",
            )

        orgunit_ct = ContentType.objects.get_by_natural_key(app_label="iaso", model="orgunit")
        surviving_ids = OrgUnit.objects.annotate(id_as_str=Cast("id", TextField())).values("id_as_str")
        self._delete_qs(
            CommentIaso.objects.filter(content_type=orgunit_ct).exclude(object_pk__in=surviving_ids),
            label="CommentIaso[orgunit orphan]",
        )

    def _cleanup_export_logs(self):
        if self.dry_run:
            return
        t0 = time.monotonic()
        total = 0
        # Single SQL per chunk — no Python-level ID transfer, no ORM LEFT JOIN.
        # NOT EXISTS with an indexed exportlog_id is efficient even on large tables.
        while True:
            self.cursor.execute(
                "DELETE FROM iaso_exportlog"
                " WHERE id IN ("
                "   SELECT id FROM iaso_exportlog el"
                "   WHERE NOT EXISTS ("
                "     SELECT 1 FROM iaso_exportstatus_export_logs sel WHERE sel.exportlog_id = el.id"
                "   )"
                f"  LIMIT {self.chunk_size}"
                ")"
            )
            n = self.cursor.rowcount
            total += n
            _log(f"  ExportLog[orphan]: {total:,} deleted so far…")
            if n < self.chunk_size:
                break
        if total:
            _log(f"  ExportLog[orphan]: {total:,} total ({time.monotonic() - t0:.1f}s)")

    # -----------------------------------------------------------------------
    # Main account deletion (graph-based)
    # -----------------------------------------------------------------------

    def _delete_account(self, account, discovered, deletion_order):
        _log(f"Account {account.id}: {account.name!r}")

        # ---- Null out self-referential FK cycles before any deletion ----
        # Account.default_version → SourceVersion and SourceVersion → DataSource → Account
        # form a cycle that blocks cascade deletion of SourceVersion.
        if not self.dry_run:
            Account.objects.filter(pk=account.pk).update(default_version=None)

        # ---- Collect data we'll need BEFORE any deletions start ----
        # Profile is in the FK graph (discovered via 'account' filter) and will be
        # deleted by the auto topo step.  Capture user_ids now before that happens.
        user_ids = list(Profile.objects.filter(account=account).values_list("user_id", flat=True))

        # Models the manual sections own completely — exclude from the auto step so
        # the auto step doesn't redundantly re-attempt them (0-row no-ops are cheap
        # but the intent is clearer when responsibilities are explicit).
        # Profile IS left in the auto step — it will be handled there in topo order.
        manual_models = {
            DataSource,  # M2M gap, handled via _delete_datasource_tree
            Form,  # M2M gap, handled via _delete_forms
        }

        # ---- Step 1: Manual — DataSource tree (M2M gap) ----
        # Must run BEFORE the auto step because Instance/OrgUnit deletions within it
        # clear FK references that would otherwise block the topo-sorted deletions.
        with self._doing(f"account={account.id} DataSource tree"):
            for project in Project.objects.filter(account=account):
                self._delete_datasource_tree(
                    list(project.data_sources.all()),
                    label_prefix=f"proj[{project.id}]/",
                )

        # ---- Step 2: Manual — break PROTECT cycles that topo sort can't handle ----

        # PlanningSamplingResult.planning = CASCADE(Planning) and
        # Planning.selected_sampling_result = PROTECT(PSR) form a circular PROTECT.
        # Django's Collector raises PROTECT on PSR even when Planning is also being
        # collected — delete PSR first so Planning has no blocker.
        with self._doing(f"account={account.id} PlanningSamplingResult"):
            if not self.dry_run:
                _chunked_delete(
                    PlanningSamplingResult.objects.filter(planning__project__account=account),
                    self.chunk_size,
                    "PlanningSamplingResult",
                )

        # Entity.attributes → Instance is PROTECT; Instance.entity → Entity is DO_NOTHING.
        with self._doing(f"account={account.id} Entity.attributes = NULL"):
            if not self.dry_run:
                Entity.objects_include_deleted.filter(account=account).update(attributes=None)
            else:
                _log(
                    f"  [DRY RUN] Entity.attributes=NULL: ~{Entity.objects_include_deleted.filter(account=account).count()}"
                )

        # ---- Step 3: Auto — topo-sorted FK-graph deletion ----
        with self._doing(f"account={account.id} FK-graph auto-deletion"):
            _log(
                f"  Running FK-graph auto-deletion ({len(discovered)} models, skipping {len(manual_models)} manual)..."
            )
            execute_graph_deletion(
                discovered,
                deletion_order,
                account,
                self.chunk_size,
                self.dry_run,
                skip_models=manual_models,
            )

        # ---- Step 4: Manual — Form (M2M gap, after auto cleared FormVersion etc.) ----
        with self._doing(f"account={account.id} Form"):
            self._delete_forms(account)

        # ---- Step 5: Manual — User (upstream from Profile, not in reverse FK graph) ----
        # Profile was deleted in the auto step; use the user_ids collected at the top.
        with self._doing(f"account={account.id} User"):
            users = User.objects.filter(pk__in=user_ids)
            self._delete_qs(users, label="User")

        # ---- Step 6: Account itself ----
        if not self.dry_run:
            account_id, account_name = account.id, account.name
            account.delete()
            _log(f"  Account {account_id} ({account_name!r}) deleted")

        self._delete_qs(Device.objects.filter(projects=None), label="Device[orphan]")
        self._sql("DELETE FROM vector_control_apiimport", label="vector_control_apiimport")

    # -----------------------------------------------------------------------
    # Entry point
    # -----------------------------------------------------------------------

    def handle(self, *args, **options):
        self.chunk_size = options["chunk_size"]
        self.dry_run = options.get("dry_run", False)
        self.cursor = connection.cursor()
        self._current_step = ""

        # Build FK graph once (same for all accounts)
        _log("Building FK graph from Account...")
        discovered, graph_edges = build_fk_graph(Account)
        deletion_order = topo_sort_deletion_order(discovered, graph_edges)
        _log(f"  Discovered {len(discovered)} models, topo-sorted deletion order computed")

        # --list-accounts mode
        if options.get("list_accounts"):
            for acct in Account.objects.order_by("id"):
                _log(f"  {acct.id:6d}  {acct.name}")
            return

        # --show-graph mode
        if options.get("show_graph"):
            account = None
            if options.get("for_account"):
                account = Account.objects.get(pk=options["for_account"])
            show_graph(discovered, graph_edges, deletion_order, account=account)
            return

        if self.dry_run:
            _log("*** DRY RUN — no data will be modified ***")

        _log("Available accounts:")
        for acct in Account.objects.order_by("id"):
            _log(f"  {acct.id}: {acct.name}")

        account_to_keep = None
        full_cleanup = False

        if options.get("account_to_keep") is not None:
            account_id_to_keep = options["account_to_keep"]
            account_to_keep = Account.objects.get(pk=account_id_to_keep)
            _log(f"Keeping: {account_id_to_keep} — {account_to_keep.name!r}")
            accounts_to_delete = list(Account.objects.exclude(pk=account_id_to_keep).order_by("-id"))
            random.shuffle(accounts_to_delete)
            full_cleanup = True
        else:
            ids = options["accounts_to_delete"]
            accounts_to_delete = list(Account.objects.filter(pk__in=ids))
            if len(accounts_to_delete) != len(ids):
                found = {a.id for a in accounts_to_delete}
                raise SystemExit(f"Accounts not found: {[i for i in ids if i not in found]}")

        self._pre_flight()

        for account in accounts_to_delete:
            _log(f"--- Deleting account={account.id} ({account.name!r}) ---")
            try:
                self._delete_account(account, discovered, deletion_order)
                _log(f"--- OK account={account.id} ({account.name!r}) deleted ---")
            except Exception:
                _log(
                    f"ERROR account={account.id!r} ({account.name!r})"
                    f" at step [{self._current_step}]:\n{traceback.format_exc()}"
                )
                _log(f"--- FAILED account={account.id} ({account.name!r}) ---")

        if full_cleanup:
            self._post_flight(account_to_keep)

        _log("Done!")
        _log("Row counts after deletion:")
        from django.apps import apps as django_apps

        all_models = sorted(django_apps.get_models(), key=lambda m: m._meta.label)
        for model in all_models:
            manager = getattr(model, "objects_include_deleted", model._default_manager)
            try:
                n = manager.count()
            except Exception:
                continue
            _log(f"  {model._meta.label:<55s}: {n:>10,}")

        _log("Remaining accounts:")
        for acct in Account.objects.order_by("id"):
            _log(f"  {acct.id:6d}  {acct.name}")
        _log("Remaining credentials:")
        for cred in ExternalCredentials.objects.all():
            _log(f"  credential: {cred.id} {cred.url} {cred.login} {cred.name}")
