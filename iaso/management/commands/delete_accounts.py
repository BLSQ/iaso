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

What's out of graph (needs dedicated code):
  - DataSource / SourceVersion / OrgUnit — linked to Account via
    Project.data_sources M2M, not a direct FK; the BFS path via credentials
    is SET_NULL and therefore partial
  - Form — linked via projects M2M
  - OrgUnitType — linked via projects M2M
  - Orphan audit log cleanup (content-type based, not FK based)
  - Orphan export log cleanup (no incoming M2M reference, not content-type or FK based)

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
from dataclasses import dataclass
from graphlib import TopologicalSorter

import django

from django.apps import apps as django_apps
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.sessions.models import Session
from django.core.management.base import BaseCommand
from django.db import connection
from django.db.models import ForeignKey, ManyToManyRel, OneToOneField, Q, QuerySet, TextField
from django.db.models.deletion import PROTECT, SET_NULL, Collector, ProtectedError
from django.db.models.functions import Cast

from hat.audit.models import Modification
from iaso.models import (
    Account,
    AccountFeatureFlag,
    CommentIaso,
    Form,
    MatchingAlgorithm,
    OpenHEXAInstance,
    OrgUnitType,
    RecordType,
    Report,
    ReportVersion,
    Task,
)
from iaso.models.base import (
    KILLED,
    QUEUED,
    DataSource,
    ExportLog,
    ExportRequest,
    ExportStatus,
    ExternalCredentials,
    Profile,
)
from iaso.models.device import Device
from iaso.models.entity import Entity
from iaso.models.instances import Instance, InstanceFile
from iaso.models.json_config import Config
from iaso.models.microplanning import Planning, PlanningSamplingResult
from iaso.models.org_unit import OrgUnit
from iaso.models.project import Project


try:
    from django_sql_dashboard.models import Dashboard as _Dashboard
except (ImportError, RuntimeError):
    # RuntimeError when django_sql_dashboard is installed but not in INSTALLED_APPS
    _Dashboard = None


# ---------------------------------------------------------------------------
# FK graph — discovery and topological sort
# ---------------------------------------------------------------------------

# Only follow FK edges to models from these app module prefixes.
# "iaso" covers the main app; "plugins" covers all plugin apps (polio, etc.).
# Third-party app models (django_sql_dashboard, auth, etc.) are skipped — Django
# CASCADE handles them automatically when the rows they target disappear.
_PROJECT_APP_PREFIXES = ("iaso", "plugins")

# Retry limit for auto-unblocking PROTECT errors: each attempt deletes the
# blocking objects, so convergence depends on the depth of the PROTECT chain.
_MAX_PROTECT_UNBLOCK_ATTEMPTS = 10


@dataclass
class DiscoveredModel:
    """A model discovered via BFS from Account, and how to filter/delete it."""

    account_lookup: str  # Django ORM lookup back to Account, e.g. 'project__account'
    on_delete_value: str  # on_delete of the edge that discovered this model, e.g. 'CASCADE'
    is_partial_coverage: bool  # True if any edge on the path is SET_NULL — filter may miss rows with a NULL FK


@dataclass
class FKEdge:
    """A direct FK edge between two discovered models, used to order deletions."""

    fk_holder: type  # model that declares the FK — must be deleted first
    fk_target: type  # model the FK points to
    on_delete_value: str


@dataclass
class DeletionPlanItem:
    """One model's rows to delete in _cascade_chunked_delete's plan — from either
    fast_deletes or data, never both."""

    model: type
    queryset: QuerySet  # set when this item came from collector.fast_deletes, else None
    pks: list  # set when this item came from collector.data (no bulk queryset available), else None


@dataclass
class OutOfGraphCleanupNote:
    """A table that can't be reached by the FK-graph BFS and needs dedicated cleanup code."""

    label: str  # e.g. "iaso.DataSource / SourceVersion / OrgUnit", or a bare table name
    reason: str  # why this table is out of graph and needs dedicated handling instead of the auto FK-graph


# Tables not reachable via reverse FK from Account — out of graph, require dedicated handling.
_OUT_OF_GRAPH_CLEANUP_NOTES = [
    OutOfGraphCleanupNote(
        label="iaso.DataSource / SourceVersion / OrgUnit",
        reason="linked via Project.data_sources M2M, BFS only finds those with credentials",
    ),
    OutOfGraphCleanupNote(label="iaso.Form", reason="linked via projects M2M"),
    OutOfGraphCleanupNote(label="iaso.OrgUnitType", reason="linked via projects M2M"),
    OutOfGraphCleanupNote(label="iaso.MatchingAlgorithm", reason="linked via projects M2M"),
    OutOfGraphCleanupNote(label="iaso.RecordType", reason="linked via projects M2M"),
    OutOfGraphCleanupNote(label="iaso.Device", reason="linked via projects M2M"),
    OutOfGraphCleanupNote(label="iaso.AccountFeatureFlag", reason="linked via Account.feature_flags M2M, not a FK"),
    OutOfGraphCleanupNote(
        label="iaso.CommentIaso",
        reason="GenericForeignKey (content_type + object_pk) to OrgUnit, not a real FK",
    ),
    OutOfGraphCleanupNote(
        label="auth.User",
        reason="upstream of Profile — Profile.user is a FK held BY the discovered model, pointing outward; BFS never follows that direction",
    ),
    OutOfGraphCleanupNote(
        label="iaso.OpenHEXAInstance",
        reason="upstream of OpenHEXAWorkspace, same shape as auth.User/Profile — OpenHEXAWorkspace.openhexa_instance points outward",
    ),
    OutOfGraphCleanupNote(
        label="iaso.ReportVersion",
        reason="only Report points to it (PROTECT); no reverse-FK path back to Account for BFS to follow",
    ),
    OutOfGraphCleanupNote(label="audit.Modification", reason="content-type based, no FK to Account"),
    OutOfGraphCleanupNote(
        label="iaso.ExportRequest / iaso.ExportLog",
        reason="no FK to Account — only reachable via ExportStatus.instance",
    ),
    OutOfGraphCleanupNote(label="django_sql_dashboard.Dashboard", reason="no FK to Account"),
    OutOfGraphCleanupNote(label="django.contrib.sessions.Session", reason="no FK to Account"),
    OutOfGraphCleanupNote(label="iaso.Config", reason="no relation to Account at all — only M2M to auth.User"),
    OutOfGraphCleanupNote(
        label="hat_api_import.APIImport [vector_control_apiimport]",
        reason="not a iaso/plugins app and no FK to Account",
    ),
    OutOfGraphCleanupNote(
        label="users_profile",
        reason="legacy table, no longer defined in the codebase — may still exist in older deployed databases",
    ),
]

# represents the different modes this command can be run in
MODE_LIST_ACCOUNTS = "list_accounts"
MODE_SHOW_GRAPH = "show_graph"
MODE_DELETE_ACCOUNTS = "delete_accounts"
MODE_KEEP_SINGLE_ACCOUNT = "keep_single_account"


def _is_project_model(model):
    """True if this model belongs to iaso or a plugin (not a third-party or Django built-in app)."""
    app_module = model._meta.app_config.__class__.__module__
    return app_module.startswith(_PROJECT_APP_PREFIXES)


def _on_delete_name(on_delete):
    """Human-readable name of a field's on_delete callable, e.g. 'CASCADE'."""
    return getattr(on_delete, "__name__", str(on_delete))


def build_fk_graph(root_model):
    """
    BFS from root_model through reverse FK relations.

    Returns:
      discovered : dict of {model: DiscoveredModel}
      graph_edges : list of FKEdge — directed edges from FK holder → FK target (used for topo sort)
    """
    discovered = {}  # model → DiscoveredModel
    graph_edges = []

    visited = {root_model}
    queue = deque([(root_model, None, False)])

    while queue:
        current_model, current_lookup, current_partial = queue.popleft()

        for related_object in current_model._meta.related_objects:
            if isinstance(related_object, ManyToManyRel):
                continue

            # Despite the name, Django's `related_object.related_model` is the model that
            # DEFINES the FK field (the holder) — current_model is the FK's target here.
            fk_holder = related_object.related_model
            if fk_holder in visited:
                continue
            if getattr(fk_holder._meta, "abstract", False) or getattr(fk_holder._meta, "swapped", None):
                continue
            if getattr(fk_holder._meta, "proxy", False):
                # Proxy models share their base model's DB table; deleting the base model's rows covers them.
                continue
            if not _is_project_model(fk_holder):
                continue

            field_name = related_object.field.name

            discovered_model = DiscoveredModel(
                account_lookup=field_name if current_lookup is None else f"{field_name}__{current_lookup}",
                on_delete_value=_on_delete_name(related_object.on_delete),
                # if we got here through a nullable FK at some point, any model discovered downstream is marked too
                is_partial_coverage=current_partial or (related_object.on_delete is SET_NULL),
            )

            discovered[fk_holder] = discovered_model
            visited.add(fk_holder)
            queue.append((fk_holder, discovered_model.account_lookup, discovered_model.is_partial_coverage))

    # Collect cross-edges between discovered models (for topo sort)
    for model in discovered:
        for field in model._meta.get_fields():
            if not isinstance(field, (ForeignKey, OneToOneField)):
                continue
            target = field.related_model
            if target not in discovered or target is model:
                continue
            graph_edges.append(
                FKEdge(
                    fk_holder=model,
                    fk_target=target,
                    on_delete_value=_on_delete_name(field.remote_field.on_delete),
                )
            )

    return discovered, graph_edges


def topo_sort_deletion_order(discovered, graph_edges, log):
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

    for edge in graph_edges:
        if edge.on_delete_value in ("CASCADE", "PROTECT"):
            # fk_holder must be deleted BEFORE fk_target
            # ts.add(X, Y) means Y must come before X
            ts.add(edge.fk_target, edge.fk_holder)

    try:
        return list(ts.static_order())
    except Exception as exc:
        log(f"  [topo sort] cycle detected ({exc}), falling back to reverse-BFS order")
        return list(reversed(list(discovered.keys())))


# ---------------------------------------------------------------------------
# --show-graph mode
# ---------------------------------------------------------------------------
def show_graph(discovered, deletion_order, log, account=None):
    """
    Print what the FK graph discovered, flag partial-coverage paths,
    and optionally show which discovered models have data for the account.
    """
    log(f"=== FK Graph from Account — {len(discovered)} models discovered ===")
    log("")
    log(f"{'Model':55s} {'on_delete':12s} {'filter path'}")
    log("-" * 120)

    for model in deletion_order:
        if model not in discovered:
            continue
        info = discovered[model]
        flag = "⚠" if info.is_partial_coverage else " "
        count_str = ""
        if account is not None:
            try:
                manager = getattr(model, "objects_include_deleted", model._default_manager)
                count = manager.filter(**{info.account_lookup: account}).count()
                count_str = f"  [{count} rows]"
            except Exception:
                count_str = "  [?]"
        log(f"  {flag} {model._meta.label:53s} {info.on_delete_value:12s}  {info.account_lookup}{count_str}")

    log("")
    log("⚠ = path contains a SET_NULL FK — rows where that FK is NULL are NOT found by this filter")
    log("    These models may need dedicated supplementary filters to fully cover SET_NULL rows.")
    log("")

    log("=== Out-of-graph models (dedicated handling required) ===")
    for note in _OUT_OF_GRAPH_CLEANUP_NOTES:
        log(f"  - {note.label}")
        log(f"      reason: {note.reason}")


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
    def _log(self, message):
        if self.verbosity > 0:
            self.stdout.write(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {message}")

    def _delete_with_sql(self, sql, params=None, label="SQL"):
        """Deletes data by executing a SQL query - useful for deleting models where there's no clear FK path to the Account model (e.g. users_profile)."""
        if self.dry_run:
            self._log(f"  [DRY RUN] {label}: {sql[:100]}")
            return 0
        if params:
            self.cursor.execute(sql, params)
        else:
            self.cursor.execute(sql)
        row_count = self.cursor.rowcount
        if row_count:
            self._log(f"  {label}: {row_count:,} deleted")
        return row_count

    def _delete_qs(self, queryset, label=None):
        """Deletes a whole queryset with a single queryset.delete() - useful for deleting small tables"""
        model = queryset.model
        label = label or model.__name__
        if self.dry_run:
            self._log(f"  [DRY RUN] {label}: ~{queryset.count()}")
            return
        if model is not Modification:
            self._delete_modification_logs_for_pks(
                ContentType.objects.get_for_model(model), list(queryset.values_list("pk", flat=True))
            )
        deleted_count, _ = queryset.delete()
        self._log(f"  {label}: {deleted_count} deleted")

    def _delete_modification_logs_for_pks(self, content_type, pks):
        """
        Modification has no real DB-level FK to the model it logs (content_type + object_id,
        GenericForeignKey-style) — rows referencing pks about to be deleted become invisible
        orphans unless cleaned up right here, alongside the rows themselves.
        """
        if not pks:
            return
        self._delete_qs(
            Modification.objects.filter(content_type=content_type, object_id__in=[str(pk) for pk in pks]),
            label=f"Modification[{content_type.model}]",
        )

    def _delete_qs_in_chunks(self, queryset, label=None):
        """Deletes a queryset in chunks with raw_delete() — useful for deleting big tables that can't be loaded at once."""
        model = queryset.model
        label = label or model.__name__
        if self.dry_run:
            self._log(f"  [DRY RUN] {label}: ~{queryset.count()}")
            return 0

        content_type = ContentType.objects.get_for_model(model) if model is not Modification else None

        total = 0
        while True:
            ids = list(queryset.order_by("pk").values_list("pk", flat=True)[: self.chunk_size])
            if not ids:
                break
            if content_type is not None:
                self._delete_modification_logs_for_pks(content_type, ids)
            chunk_qs = queryset.filter(pk__in=ids)
            try:
                deleted = chunk_qs._raw_delete(using=queryset.db)
            except Exception as exc:
                self._log(f"  {label}: _raw_delete failed ({exc!r}), falling back to .delete()")
                _, counts = chunk_qs.delete()
                deleted = counts.get(model._meta.label, 0)
                counts_str = ", ".join(
                    f"{model_label}: {count}" for model_label, count in sorted(counts.items()) if count
                )
                self._log(f"  {label}: cascade counts: {counts_str}")
            total += deleted

        return total

    def _delete_with_protect_retries(self, queryset, label):
        """
        Deletes `queryset`, auto-resolving ProtectedError by deleting the blocking rows
        first — recursively, so a PROTECT chain deeper than one level (e.g. a multi-level
        Team.parent hierarchy, where unblocking a parent uncovers a grandparent still
        blocked by it) doesn't escape as an uncaught exception. Each level reuses this
        same retry logic instead of a bare, non-retried delete.
        """
        deleted_count = 0
        for attempt in range(_MAX_PROTECT_UNBLOCK_ATTEMPTS):
            try:
                deleted_count += self._delete_qs_in_chunks(queryset, label=label)
                return deleted_count
            except ProtectedError as exc:
                blocking_pks_by_model = defaultdict(list)
                for obj in exc.protected_objects:
                    blocking_pks_by_model[type(obj)].append(obj.pk)
                for blocker_model, pks in blocking_pks_by_model.items():
                    self._log(f"  [auto-unblock] {blocker_model.__name__} ×{len(pks)} blocking {label}")
                    self._delete_with_protect_retries(
                        blocker_model.objects.filter(pk__in=pks),
                        label=f"{blocker_model.__name__}[unblock]",
                    )
        raise RuntimeError(
            f"Could not delete {label} after {_MAX_PROTECT_UNBLOCK_ATTEMPTS} attempts — PROTECT cycle not resolved"
        )

    def _null_self_referential_fks(self, model, qs, label):
        """
        Nulls any nullable, self-referential PROTECT FK on `qs` (e.g. Team.parent,
        Entity.merged_to) before it gets deleted. Mirrors the OrgUnit.parent handling
        above: on_delete=PROTECT raises as soon as ANY row references the one being
        deleted, whether or not that row is also part of the same delete — so a tree
        deleted in one batch always trips over itself unless the self-reference is
        broken first.

        Scoped to on_delete=PROTECT specifically (not e.g. CommentIaso's self-ref
        CASCADE) — CASCADE already deletes the whole subtree without our help, so
        nulling it first would just be unnecessary writes on rows about to disappear.
        """
        for field in model._meta.local_fields:
            if (
                isinstance(field, ForeignKey)
                and field.related_model is model
                and field.null
                and field.remote_field.on_delete is PROTECT
            ):
                self._update_qs(qs, label=f"{label}.{field.name}=NULL[self-ref]", **{field.name: None})

    def _update_qs(self, queryset, label=None, **fields):
        """Dry-run-aware wrapper around queryset.update(**fields)."""
        label = label or queryset.model.__name__
        if self.dry_run:
            self._log(f"  [DRY RUN] {label}: would update ~{queryset.count()} rows to {fields}")
            return 0
        updated = queryset.update(**fields)
        if updated:
            self._log(f"  {label}: {updated} updated")
        return updated

    @contextmanager
    def _doing(self, step):
        """Context manager: logs current step; re-raises with context on error."""
        self._current_step = step
        try:
            yield
        except Exception as exc:
            raise RuntimeError(f"[step: {step}] {exc}") from exc

    def _cascade_chunked_delete(self, queryset, label):
        """
        Drop-in replacement for queryset.delete() that:
        - Is dry-run aware — logs an estimated row count and returns without touching the DB
        - Uses Django's Collector to discover the full cascade (respects model evolution)
        - Logs each model being deleted with its count
        - Deletes in chunks instead of one giant transaction
        For models without signals (most iaso models), Collector stores querysets in
        fast_deletes — no instances are loaded into memory.
        """
        if self.dry_run:
            self._log(
                f"  [DRY RUN] {label}: would cascade-delete ~{queryset.count()} rows and everything referencing them"
            )
            return

        for attempt in range(_MAX_PROTECT_UNBLOCK_ATTEMPTS):
            collector = Collector(using=queryset.db)
            try:
                collector.collect(queryset)
                break
            except ProtectedError as exc:
                blocking_pks_by_model = defaultdict(list)
                for obj in exc.protected_objects:
                    blocking_pks_by_model[type(obj)].append(obj.pk)
                for blocker_model, pks in blocking_pks_by_model.items():
                    self._log(f"  [auto-unblock] {blocker_model.__name__} ×{len(pks)} blocking {label} (collect phase)")
                    self._delete_with_protect_retries(
                        blocker_model.objects.filter(pk__in=pks), label=f"{blocker_model.__name__}[unblock]"
                    )
        else:
            raise RuntimeError(
                f"Could not collect {label} after {_MAX_PROTECT_UNBLOCK_ATTEMPTS} attempts — PROTECT cycle not resolved"
            )

        collector.sort()

        # Build a unified deletion plan from both fast_deletes (querysets) and
        # data (instance dicts). Topo-sort them together so FK holders are always
        # deleted before the models they reference, regardless of which list they
        # came from.
        plan_items = []
        for qs in collector.fast_deletes:
            plan_items.append(DeletionPlanItem(model=qs.model, queryset=qs, pks=None))
        for model, instances in collector.data.items():
            pks = [obj.pk for obj in instances]
            if pks:
                plan_items.append(DeletionPlanItem(model=model, queryset=None, pks=pks))

        # Discover forward-FK edges among plan_items' models: if model A has a FK to
        # model B, A must be deleted first. Use _meta.local_fields (forward FK/O2O
        # only) — _meta.get_fields() also returns reverse relations which would flip
        # the dependency direction and break the sort.
        # plan_models as dict preserves insertion order for cycle-node fallback.
        plan_models = {}
        fk_targets_by_holder = {}
        for plan_item in plan_items:
            model = plan_item.model
            plan_models[model] = None
            fk_targets_by_holder[model] = set()

        for model in plan_models:
            for field in model._meta.local_fields:
                if isinstance(field, (ForeignKey, OneToOneField)):
                    # Skip SET_NULL FKs: they don't create a hard ordering constraint
                    # (the DB will null them on target deletion, or we've already done so).
                    # Including them creates false cycles (e.g. DataSource.default_version
                    # ↔ SourceVersion.data_source).
                    if field.remote_field.on_delete is SET_NULL:
                        continue
                    target = field.related_model
                    if target and target in plan_models and target is not model:
                        # model holds FK → delete model first → target depends on model
                        fk_targets_by_holder[model].add(target)

        # Topo sort via graphlib.TopologicalSorter (same tool topo_sort_deletion_order
        # uses). Drained incrementally via get_ready()/done() rather than static_order()
        # so a cycle doesn't abort the whole sort: whatever's left stuck when get_ready()
        # comes back empty is appended at the end in plan_items insertion order instead
        # (fast_deletes before data, so SourceVersion before DataSource). DataSource.
        # default_version is already nulled, so either order is safe.
        ts = TopologicalSorter()
        for model in plan_models:
            ts.add(model)
        for holder, targets in fk_targets_by_holder.items():
            for target in targets:
                ts.add(target, holder)
        ts.prepare()
        ordered_models = []
        while ts.is_active():
            ready = ts.get_ready()
            if not ready:
                break
            ordered_models.extend(ready)
            ts.done(*ready)

        # Append cycle participants at the end in their original insertion order
        cycle_models = [m for m in plan_models if m not in set(ordered_models)]
        if cycle_models:
            self._log(f"  {label}: topo-sort cycle (ignored): {[m.__name__ for m in cycle_models]}")
        ordered_models.extend(cycle_models)

        model_to_item = {item.model: item for item in plan_items}
        skipped = [m for m in ordered_models if m not in model_to_item]
        if skipped:
            self._log(
                f"  [warn] {label}: {len(skipped)} model(s) in topo order but not in plan: {[m.__name__ for m in skipped]}"
            )
        ordered_items = [model_to_item[m] for m in ordered_models if m in model_to_item]

        if plan_items:
            self._log(f"  {label}: cascade plan — {', '.join(sorted(item.model._meta.label for item in plan_items))}")

        total_steps = len(ordered_items)
        for step, item in enumerate(ordered_items, 1):
            step_label = f"{label}→{item.model._meta.label}"
            self._log(f"  [{step}/{total_steps}] {step_label}…")
            step_started_at = time.monotonic()
            item_qs = item.queryset if item.queryset is not None else item.model.objects.filter(pk__in=item.pks)
            deleted_count = self._delete_qs_in_chunks(item_qs, label=step_label)
            if deleted_count:
                self._log(f"  {step_label}: {deleted_count:,} deleted ({time.monotonic() - step_started_at:.1f}s)")

    def _delete_datasource_tree(self, datasources, label_prefix=""):
        """Delete each DataSource fully before moving to the next."""
        ds_list = datasources if isinstance(datasources, list) else list(datasources)
        self._log(f"  Deleting {len(ds_list)} datasource(s)")

        for ds in ds_list:
            ds_label = f"{label_prefix}ds[{ds.id}]"
            versions_qs = ds.versions.all()
            instances_in_ds = Instance.objects.filter(org_unit__version__in=versions_qs)
            entities_qs = Entity.objects_include_deleted.filter(attributes__in=instances_in_ds)

            with self._doing(f"Entity {ds_label}"):
                # Instance.entity is DO_NOTHING — PostgreSQL still enforces the FK.
                # Null it out before deleting Entity to avoid IntegrityError.
                self._update_qs(
                    Instance.objects.filter(entity__in=entities_qs),
                    label=f"Instance.entity=NULL[{ds_label}]",
                    entity=None,
                )
                self._delete_qs(entities_qs, label=f"Entity[{ds_label}]")

            with self._doing(f"InstanceFile {ds_label}"):
                self._delete_qs(
                    InstanceFile.objects.filter(instance__in=instances_in_ds),
                    label=f"InstanceFile[{ds_label}]",
                )

            with self._doing(f"Instance {ds_label}"):
                self._delete_qs_in_chunks(instances_in_ds, label=f"Instance[{ds_label}]")

            # Planning.org_unit = PROTECT blocks OrgUnit deletion (hence DataSource cascade).
            # Cycle: Planning.selected_sampling_result = PROTECT(PSR) ↔ PSR.planning = CASCADE(Planning)
            # Break it: null Planning.selected_sampling_result → delete PSR → delete Planning.
            with self._doing(f"Planning/PSR cycle {ds_label}"):
                planning_qs = Planning.objects.filter(org_unit__version__in=versions_qs)
                self._update_qs(
                    planning_qs,
                    label=f"Planning.selected_sampling_result=NULL[{ds_label}]",
                    selected_sampling_result=None,
                )
                self._delete_qs_in_chunks(
                    PlanningSamplingResult.objects.filter(planning__in=planning_qs),
                    label=f"PlanningSamplingResult[{ds_label}]",
                )
                self._delete_qs_in_chunks(planning_qs, label=f"Planning[{ds_label}]")

            with self._doing(f"DataSource cascade {ds_label}"):
                # DataSource.default_version → SourceVersion cycle: null first.
                self._update_qs(
                    DataSource.objects.filter(pk=ds.pk),
                    label=f"DataSource.default_version=NULL[{ds_label}]",
                    default_version=None,
                )
                # OrgUnit.parent is a self-referential FK; batch _raw_delete fails if any
                # row's parent is another row in the same batch. Null all within this
                # datasource's versions before the cascade reaches OrgUnit.
                self._update_qs(
                    OrgUnit.objects.filter(version__in=versions_qs),
                    label=f"OrgUnit.parent=NULL[{ds_label}]",
                    parent=None,
                )
                self._cascade_chunked_delete(DataSource.objects.filter(pk=ds.pk), ds_label)

    # -----------------------------------------------------------------------
    # Pre/post-deletion cleanup
    # -----------------------------------------------------------------------
    def _pre_deletion_clean_up(self, accounts_to_delete):
        self._log("Pre-deletion cleanup: clearing users_profile, orphan Instance, InstanceFile, OrgUnit...")
        try:
            self._delete_with_sql("DELETE FROM users_profile", label="users_profile")
        except django.db.utils.ProgrammingError:
            pass

        # Instances with no form (PROTECT FK — must go before any Form cleanup)
        no_form = Instance.objects.filter(form=None)
        self._delete_qs(InstanceFile.objects.filter(instance__in=no_form), label="InstanceFile[no form]")
        self._delete_qs(no_form, label="Instance[no form]")

        # OrgUnits with no version: null self-ref parent first, then delete instances/files
        # that reference them (DO_NOTHING FK — DB enforces NO ACTION so must be cleared first)
        no_version_ou = OrgUnit.objects.filter(version=None)
        self._update_qs(no_version_ou, label="OrgUnit[no version].parent=NULL", parent=None)  # break self-ref tree
        no_version_instances = Instance.objects.filter(org_unit__in=no_version_ou)
        self._delete_qs(
            InstanceFile.objects.filter(instance__in=no_version_instances), label="InstanceFile[ou no version]"
        )
        self._delete_qs(no_version_instances, label="Instance[ou no version]")
        self._delete_qs(no_version_ou, label="OrgUnit[no version]")

        orphans = Instance.objects.filter(project=None, form=None, org_unit=None)
        self._delete_qs(InstanceFile.objects.filter(instance__in=orphans), label="InstanceFile[orphan]")
        self._delete_qs(orphans, label="Instance[orphan]")

        self._update_qs(
            Task.objects.filter(status=QUEUED, account__in=accounts_to_delete),
            label="Task[queued→killed]",
            status=KILLED,
        )
        self._log("finished pre-deletion cleanup")

    def _post_deletion_clean_up(self, account_to_keep):
        """
        Sweeps data left over once only `account_to_keep` should remain.
        Most cleanups here are scoped to actual orphans (no surviving FK/M2M link).
        A few tables (e.g. Session, Dashboard, Config) have no link to Account at all, not even
        indirectly — there's no way to tell which rows belong to the deleted account(s), so
        those are wiped in full rather than left as an unscoped leak. Accepted tradeoff, not
        a bug: only run --account-to-keep when losing that unscoped data is acceptable.
        """
        self._log(
            "Post-deletion cleanup: clearing orphan DataSource, Forms, Instance, Project, InstanceFile, APIImport, Session, Device..."
        )
        # Orphan datasources — delete one by one, continue on error
        ds_ids_to_keep = DataSource.objects.filter(projects__account=account_to_keep).values_list("id", flat=True)
        orphan_ds = list(DataSource.objects.exclude(id__in=ds_ids_to_keep))
        self._log(f"Orphan datasources: {len(orphan_ds)}")
        for ds in orphan_ds:
            try:
                self._delete_datasource_tree([ds])
            except Exception as exc:
                self._log(f"  [error] orphan ds[{ds.id}] {ds.name!r}: {exc} — skipping")

        # Forms without projects
        forms_without_project = Form.objects_include_deleted.filter(projects=None)
        self._delete_qs(
            InstanceFile.objects.filter(instance__in=Instance.objects.filter(form__in=forms_without_project)),
            label="InstanceFile[form no project]",
        )
        self._delete_qs(Instance.objects.filter(form__in=forms_without_project), label="Instance[form no project]")

        self._delete_qs(Project.objects.filter(account=None), label="Project[no account]")
        # Forms with no form_id may still have instances (not covered by the forms_without_project cleanup above).
        forms_no_form_id = Form.objects_include_deleted.filter(form_id=None)
        self._delete_qs(
            InstanceFile.objects.filter(instance__in=Instance.objects.filter(form__in=forms_no_form_id)),
            label="InstanceFile[form no form_id]",
        )
        self._delete_qs(Instance.objects.filter(form__in=forms_no_form_id), label="Instance[form no form_id]")
        self._delete_qs(forms_no_form_id, label="Form[no form_id]")
        # Rows with no app_id can't be attributed to any account — delete them to avoid leaks.
        self._delete_with_sql(
            "DELETE FROM vector_control_apiimport WHERE headers->>'QUERY_STRING' NOT LIKE '%app_id=%'",
            label="vector_control_apiimport[no app_id]",
        )
        self._delete_qs(Device.objects.filter(projects=None), label="Device[orphan]")

        for form_without_project in forms_without_project:
            try:
                self._delete_form_without_project(form_without_project)
            except Exception:
                self._log(traceback.format_exc())

        self._delete_with_sql(
            "DELETE FROM iaso_exportrequest WHERE id NOT IN (SELECT DISTINCT export_request_id FROM iaso_exportstatus)",
            label="iaso_exportrequest[orphan]",
        )
        self._cleanup_modification_logs()
        self._cleanup_export_logs()

        # OpenHEXAWorkspace are deleted after Accounts are deleted (CASCADE), so any OHInstance without any workspace has to be deleted
        self._delete_qs(OpenHEXAInstance.objects.filter(openhexa_workspaces__isnull=True), label="OpenHEXAInstance")

        # the following models have no link at all with Account
        if _Dashboard is not None:
            self._delete_qs(_Dashboard.objects.all(), label="Dashboard")
        self._delete_qs(Config.objects.all(), label="Config")
        self._delete_qs(Session.objects.all(), label="Session")

        self._log("finished post-deletion cleanup")

    def _delete_form_without_project(self, form):
        """Clear a project-less Form's M2M/version data and hard-delete it."""
        label = f"Form[no project][{form.id}]"
        if self.dry_run:
            self._log(f"  [DRY RUN] {label}: would clear org_unit_types, delete versions' instances/files, hard-delete")
            return
        OrgUnitType.reference_forms.through.objects.filter(form=form).delete()
        form.org_unit_types.clear()
        InstanceFile.objects.filter(instance__form_version__in=form.form_versions.all()).delete()
        Instance.objects.filter(form_version__in=form.form_versions.all()).delete()
        form.delete_hard()
        self._log(f"  {label}: done")

    def _cleanup_modification_logs(self):
        self._log("Cleaning modification logs...")
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
            deleted = self._delete_with_sql(sql, label=f"Modification batch {i}")
            if deleted == 0:
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
        started_at = time.monotonic()
        total = 0
        # Single SQL per chunk — no Python-level ID transfer, no ORM LEFT JOIN.
        # NOT EXISTS with an indexed exportlog_id is efficient even on large tables.
        delete_sql = (
            "DELETE FROM iaso_exportlog"
            " WHERE id IN ("
            "   SELECT id FROM iaso_exportlog el"
            "   WHERE NOT EXISTS ("
            "     SELECT 1 FROM iaso_exportstatus_export_logs sel WHERE sel.exportlog_id = el.id"
            "   )"
            f"  LIMIT {self.chunk_size}"
            ")"
        )
        while True:
            deleted = self._delete_with_sql(delete_sql, label="ExportLog[orphan] batch")
            total += deleted
            if deleted < self.chunk_size:
                break
        if total:
            self._log(f"  ExportLog[orphan]: {total:,} total ({time.monotonic() - started_at:.1f}s)")

    # -----------------------------------------------------------------------
    # Main account deletion (graph-based)
    # -----------------------------------------------------------------------
    def _delete_account(self, account, discovered, deletion_order):
        self._log(f"Account {account.id}: {account.name!r}")

        # ---- Null out self-referential FK cycles before any deletion ----
        # Account.default_version → SourceVersion and SourceVersion → DataSource → Account
        # form a cycle that blocks cascade deletion of SourceVersion.
        self._update_qs(
            Account.objects.filter(pk=account.pk),
            label=f"Account[{account.id}].default_version=NULL",
            default_version=None,
        )

        # ---- Collect data we'll need BEFORE any deletions start ----
        # Profile and Project are in the FK graph (discovered via 'account' filter) and will be deleted by the auto topo step
        # multiple data types depend on them so we need to save the required info
        user_ids = list(Profile.objects.filter(account=account).values_list("user_id", flat=True))
        app_ids = list(
            Project.objects.filter(account=account)
            .exclude(app_id=None)
            .exclude(app_id="")
            .values_list("app_id", flat=True)
        )
        form_ids = list(
            Form.objects_include_deleted.filter(projects__account=account).values_list("pk", flat=True).distinct()
        )
        org_unit_type_ids = list(
            OrgUnitType.objects.filter(projects__account=account).values_list("pk", flat=True).distinct()
        )
        matching_algorithm_ids = list(
            MatchingAlgorithm.objects.filter(projects__account=account).values_list("pk", flat=True)
        )
        org_unit_ids = list(
            OrgUnit.objects.filter(version__data_source__projects__account=account)
            .values_list("pk", flat=True)
            .distinct()
        )
        record_type_ids = list(RecordType.objects.filter(projects__account=account).values_list("pk", flat=True))
        report_version_ids = list(
            Report.objects.filter(project__account=account).values_list("published_version_id", flat=True).distinct()
        )
        device_ids = list(Device.objects.filter(projects__account=account).values_list("pk", flat=True))
        # ExportStatus has no FK to Account either — only reachable via its Instance, which
        # can itself be tied to the account through any of 3 independent paths (project,
        # org_unit's version/data_source, or form). Collect the ExportRequest/ExportLog ids
        # it's about to orphan so Step 4g can clean them up once ExportStatus cascades away.
        export_status_for_account = ExportStatus.objects.filter(
            Q(instance__project__account=account)
            | Q(instance__org_unit__version__data_source__projects__account=account)
            | Q(instance__form__projects__account=account)
        )
        export_request_ids = list(export_status_for_account.values_list("export_request_id", flat=True).distinct())
        export_log_ids = list(export_status_for_account.values_list("export_logs__id", flat=True).distinct())

        # Models the out-of-graph sections own completely — exclude from the auto step so
        # the auto step doesn't redundantly re-attempt them (0-row no-ops are cheap
        # but the intent is clearer when responsibilities are explicit).
        # Profile IS left in the auto step — it will be handled there in topo order.
        out_of_graph_models = {
            DataSource,  # M2M gap, handled via _delete_datasource_tree
            Form,  # M2M gap
            OrgUnitType,  # M2M gap
        }

        # ---- Step 1: Out-of-graph — DataSource tree (M2M gap) ----
        # Must run BEFORE the auto step because Instance/OrgUnit deletions within it
        # clear FK references that would otherwise block the topo-sorted deletions.
        with self._doing(f"account={account.id} DataSource tree"):
            for project in Project.objects.filter(account=account):
                self._delete_datasource_tree(
                    list(project.data_sources.all()),
                    label_prefix=f"proj[{project.id}]/",
                )

        # ---- Step 1b: Out-of-graph — CommentIaso (GenericForeignKey to OrgUnit, no real FK) ----
        # Uses org_unit_ids captured at the top — OrgUnit rows are already gone by now.
        with self._doing(f"account={account.id} CommentIaso"):
            orgunit_ct = ContentType.objects.get_for_model(OrgUnit)
            self._delete_qs(
                CommentIaso.objects.filter(content_type=orgunit_ct, object_pk__in=[str(pk) for pk in org_unit_ids]),
                label="CommentIaso",
            )

        # ---- Step 2: Break PROTECT cycles that topo sort can't handle ----

        # PlanningSamplingResult.planning = CASCADE(Planning) and
        # Planning.selected_sampling_result = PROTECT(PSR) form a circular PROTECT.
        # Django's Collector raises PROTECT on PSR even when Planning is also being
        # collected — delete PSR first so Planning has no blocker.
        with self._doing(f"account={account.id} PlanningSamplingResult"):
            self._delete_qs_in_chunks(
                PlanningSamplingResult.objects.filter(planning__project__account=account),
                label="PlanningSamplingResult",
            )

        # Entity.attributes → Instance is PROTECT; Instance.entity → Entity is DO_NOTHING.
        with self._doing(f"account={account.id} Entity.attributes = NULL"):
            self._update_qs(
                Entity.objects_include_deleted.filter(account=account), label="Entity.attributes=NULL", attributes=None
            )

        # ---- Step 3: Auto — topo-sorted FK-graph deletion ----
        with self._doing(f"account={account.id} FK-graph auto-deletion"):
            self._log(
                f"  Running FK-graph auto-deletion ({len(discovered)} models, "
                f"skipping {len(out_of_graph_models)} out-of-graph)..."
            )
            self._execute_graph_deletion(
                discovered,
                deletion_order,
                account,
                skip_models=out_of_graph_models,
            )

        # ---- Step 4: Out-of-graph — Form (M2M gap, after auto cleared FormVersion etc.) ----
        # Uses form_ids captured at the top — Project rows are already gone by now.
        with self._doing(f"account={account.id} Form"):
            forms = Form.objects_include_deleted.filter(pk__in=form_ids)
            self._delete_qs(forms, label="Form")

        # ---- Step 4b: Out-of-graph — OrgUnitType (M2M gap, same shape as Form) ----
        # Uses org_unit_type_ids captured at the top — Project rows are already gone by now.
        with self._doing(f"account={account.id} OrgUnitType"):
            org_unit_types = OrgUnitType.objects.filter(pk__in=org_unit_type_ids)
            self._delete_qs(org_unit_types, label="OrgUnitType")

        # --- Step 4c: Out-of-graph - MatchingAlgorithm (M2M gap, linked to Projects) ----
        # Uses matching_algorithm_ids captured at the top — Project rows are already gone by now.
        with self._doing(f"account={account.id} MatchingAlgorithm"):
            matching_algorithms = MatchingAlgorithm.objects.filter(pk__in=matching_algorithm_ids)
            self._delete_qs(matching_algorithms, label="MatchingAlgorithm")

        # --- Step 4d: Out-of-graph - RecordType (M2M gap, linked to Projects) ----
        # Uses record_type_ids captured at the top — Project rows are already gone by now.
        with self._doing(f"account={account.id} RecordType"):
            record_types = RecordType.objects.filter(pk__in=record_type_ids)
            self._delete_qs(record_types, label="RecordType")

        # --- Step 4e: Out-of-graph - ReportVersion (Report.published_version = PROTECT, no reverse FK) ----
        # Uses report_version_ids captured at the top — Report rows are already gone by now.
        with self._doing(f"account={account.id} ReportVersion"):
            report_versions = ReportVersion.objects.filter(pk__in=report_version_ids)
            self._delete_qs(report_versions, label="ReportVersion")

        # --- Step 4f: Out-of-graph - Device (M2M gap, linked to Projects) ----
        # Uses device_ids captured at the top — Project rows are already gone by now.
        with self._doing(f"account={account.id} Device"):
            devices = Device.objects.filter(pk__in=device_ids)
            self._delete_qs(devices, label="Device")

        # ---- Step 4g: Out-of-graph — Dashboard.owned_by (third-party, no FK to Account) ----
        # django_sql_dashboard is only installed in some environments (see the _Dashboard
        # import guard above) and isn't part of the auto-discovered graph (no FK to
        # Account). Its FK to User must be cleared explicitly before Users are deleted
        # below, or Postgres raises an IntegrityError — Django's on_delete is enforced by
        # the ORM Collector, not a DB-level constraint, so a plain User.delete() only
        # cascades relations the auto-discovery step actually walked.
        if _Dashboard is not None:
            with self._doing(f"account={account.id} Dashboard.owned_by=NULL"):
                self._update_qs(
                    _Dashboard.objects.filter(owned_by_id__in=user_ids),
                    label="Dashboard.owned_by=NULL",
                    owned_by=None,
                )

        # ---- Step 5: Out-of-graph — User (upstream from Profile, not in reverse FK graph) ----
        # Profile was deleted in the auto step; use the user_ids collected at the top.
        with self._doing(f"account={account.id} User"):
            users = User.objects.filter(pk__in=user_ids)
            self._delete_qs(users, label="User")

        # ---- Step 5b: vector_control_apiimport — delete rows for this account's projects ----
        # Rows are filtered by app_id (from QUERY_STRING). Rows with no app_id cannot be
        # attributed to any account and are cleaned up in _post_flight (account-to-keep mode).
        # Uses app_ids captured at the top — Project rows are already gone by now.
        for app_id in app_ids:
            self._delete_with_sql(
                "DELETE FROM vector_control_apiimport WHERE headers->>'QUERY_STRING' LIKE %s",
                params=[f"%app_id={app_id}%"],
                label=f"vector_control_apiimport[app_id={app_id}]",
            )

        # ---- Step 5c: Out-of-graph — AccountFeatureFlag (M2M with Account) ----
        with self._doing(f"account={account.id} AccountFeatureFlag"):
            self._delete_qs(AccountFeatureFlag.objects.filter(account=account), label="AccountFeatureFlag")

        # ---- Step 5d: Out-of-graph — ExportRequest / ExportLog (no FK to Account at all; only
        # reachable via ExportStatus.instance, which cascaded away with this account's Instances
        # in Step 3). Scoped to export_request_ids/export_log_ids captured at the top — deletes
        # them only if no other ExportStatus still references them.
        with self._doing(f"account={account.id} ExportRequest/ExportLog"):
            self._delete_qs(
                ExportRequest.objects.filter(pk__in=export_request_ids).exclude(
                    pk__in=ExportStatus.objects.filter(export_request_id__in=export_request_ids).values_list(
                        "export_request_id", flat=True
                    )
                ),
                label="ExportRequest[orphan]",
            )
            self._delete_qs(
                ExportLog.objects.filter(pk__in=export_log_ids).exclude(
                    pk__in=ExportStatus.objects.filter(export_logs__id__in=export_log_ids).values_list(
                        "export_logs__id", flat=True
                    )
                ),
                label="ExportLog[orphan]",
            )

        # ---- Step 6: Account itself ----
        self._delete_qs(Account.objects.filter(pk=account.pk), label=f"Account[{account.id}] {account.name!r}")

    def _execute_graph_deletion(self, discovered, deletion_order, account, skip_models=None):
        """
        Delete all discovered models in topological order.
        Each model's rows are filtered using the auto-built account_lookup.
        skip_models: set of out-of-graph model classes (excluded from this step).
        """
        skip_models = skip_models or set()
        models_processed = 0
        models_with_rows = 0
        total_deleted = 0

        for model in deletion_order:
            if model not in discovered or model in skip_models:
                continue
            info = discovered[model]
            manager = getattr(model, "objects_include_deleted", model._default_manager)

            try:
                qs = manager.filter(**{info.account_lookup: account})
            except Exception as exc:
                self._log(f"  [skip] {model.__name__}: cannot build queryset ({exc})")
                continue

            models_processed += 1
            label = f"{model.__name__}[{info.account_lookup}]"
            if info.is_partial_coverage:
                label += " ⚠ partial"

            # Self-referential PROTECT FKs (e.g. Team.parent, same idea as OrgUnit.parent
            # above) always raise ProtectedError on delete, even when both ends of the
            # reference are in the same batch — Collector's PROTECT check fires on any
            # existing referencing row regardless of it also being staged for deletion.
            # Null it upfront so the whole tree deletes in one shot, correct order.
            self._null_self_referential_fks(model, qs, label)

            if self.dry_run:
                self._log(f"  [DRY RUN] would delete {label}")
                continue

            # Belt-and-braces: auto-clears any remaining blocking objects (e.g. nullable
            # PROTECT FKs from partial-coverage models), recursively resolving PROTECT
            # chains deeper than one level.
            deleted_count = self._delete_with_protect_retries(qs, label=label)

            if deleted_count:
                self._log(f"  {label}: {deleted_count:,} deleted")
                models_with_rows += 1
                total_deleted += deleted_count

        if not self.dry_run:
            self._log(
                f"  topo step: {models_processed} models processed, {models_with_rows} non-empty, {total_deleted:,} rows deleted total"
            )

    def _print_model_stats(self):
        self._log("Row counts after deletion:")
        all_models = sorted(django_apps.get_models(), key=lambda m: m._meta.label)
        for model in all_models:
            manager = getattr(model, "objects_include_deleted", model._default_manager)
            try:
                row_count = manager.count()
            except Exception:
                continue
            self._log(f"  {model._meta.label:<55s}: {row_count:>10,}")

        self._log("Remaining accounts:")
        for account in Account.objects.order_by("id"):
            self._log(f"  {account.id:6d}  {account.name}")

        self._log("Remaining credentials:")
        for cred in ExternalCredentials.objects.all():
            self._log(f"  credential: {cred.id} {cred.url} {cred.login} {cred.name}")

    def _determine_mode(self, options):
        if options.get("list_accounts"):
            return MODE_LIST_ACCOUNTS
        if options.get("show_graph"):
            return MODE_SHOW_GRAPH
        if options.get("account_to_keep") is not None:
            return MODE_KEEP_SINGLE_ACCOUNT
        if options.get("accounts_to_delete") is not None:
            return MODE_DELETE_ACCOUNTS
        raise ValueError("unknown mode, please fix parameters")

    def _mode_list_accounts(self):
        self._log("Available accounts:")
        for account in Account.objects.order_by("id"):
            self._log(f"  {account.id:6d}  {account.name}")
        return 0

    def _build_model_graph(self):
        # Build FK graph once (same for all accounts)
        self._log("Building FK graph from Account...")
        discovered, graph_edges = build_fk_graph(Account)
        deletion_order = topo_sort_deletion_order(discovered, graph_edges, log=self._log)
        self._log(f"  Discovered {len(discovered)} models, topo-sorted deletion order computed")
        return discovered, deletion_order

    def _mode_show_graph(self, options, discovered_models, deletion_order):
        if not options.get("for_account"):
            raise ValueError("please provide the for_account parameter when running in show_graph mode")
        for_account_id = options["for_account"]
        account = Account.objects.filter(pk=for_account_id).first()
        if account is None:
            raise SystemExit(f"Account not found: {for_account_id}")
        show_graph(discovered_models, deletion_order, log=self._log, account=account)
        return 0

    def _mode_delete_accounts(self, options, discovered_models, deletion_order):
        if self.dry_run:
            self._log("*** DRY RUN — no data will be modified ***")
        self._mode_list_accounts()

        ids = options["accounts_to_delete"]
        accounts_to_delete = list(Account.objects.filter(pk__in=ids))
        if len(accounts_to_delete) != len(ids):
            found_ids = {a.id for a in accounts_to_delete}
            raise SystemExit(f"Accounts not found: {[id for id in ids if id not in found_ids]}")

        self._pre_deletion_clean_up(accounts_to_delete)
        self._delete_accounts(accounts_to_delete, discovered_models, deletion_order)

        return 0

    def _delete_accounts(self, accounts_to_delete, discovered_models, deletion_order):
        for account in accounts_to_delete:
            self._log(f"--- Deleting account={account.id} ({account.name!r}) ---")
            try:
                self._delete_account(account, discovered_models, deletion_order)
                self._log(f"--- OK account={account.id} ({account.name!r}) deleted ---")
            except Exception:
                self._log(
                    f"ERROR account={account.id!r} ({account.name!r})"
                    f" at step [{self._current_step}]:\n{traceback.format_exc()}"
                )
                self._log(f"--- FAILED account={account.id} ({account.name!r}) ---")

    def _mode_keep_single_account(self, options, discovered_models, deletion_order):
        if self.dry_run:
            self._log("*** DRY RUN — no data will be modified ***")
        self._mode_list_accounts()

        account_id_to_keep = options["account_to_keep"]
        account_to_keep = Account.objects.filter(pk=account_id_to_keep).first()
        if account_to_keep is None:
            raise SystemExit(f"Account not found: {account_id_to_keep}")
        self._log(f"Keeping: {account_id_to_keep} — {account_to_keep.name!r}")
        accounts_to_delete = list(Account.objects.exclude(pk=account_id_to_keep).order_by("-id"))
        random.shuffle(accounts_to_delete)

        self._pre_deletion_clean_up(accounts_to_delete)
        self._delete_accounts(accounts_to_delete, discovered_models, deletion_order)
        self._post_deletion_clean_up(account_to_keep)

        return 0

    # -----------------------------------------------------------------------
    # Entry point
    # -----------------------------------------------------------------------

    def handle(self, *args, **options):
        self.verbosity = options.get("verbosity", 1)
        self.chunk_size = options["chunk_size"]
        self.dry_run = options.get("dry_run", False)
        self.cursor = connection.cursor()
        self._current_step = ""

        mode = self._determine_mode(options)

        if mode == MODE_LIST_ACCOUNTS:
            return self._mode_list_accounts()

        discovered_models, deletion_order = self._build_model_graph()

        if mode == MODE_SHOW_GRAPH:
            return self._mode_show_graph(options, discovered_models, deletion_order)
        if mode == MODE_DELETE_ACCOUNTS:
            result = self._mode_delete_accounts(options, discovered_models, deletion_order)
        elif mode == MODE_KEEP_SINGLE_ACCOUNT:
            result = self._mode_keep_single_account(options, discovered_models, deletion_order)
        else:
            raise ValueError(f"unknown mode, please fix parameters: {mode!r}")

        self._log("Done!")
        self._print_model_stats()
        return result
