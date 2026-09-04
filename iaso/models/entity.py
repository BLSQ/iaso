"""Entity and related models

The entity concept might feel a bit abstract, so it might be useful to reason about them using a concrete example
(beneficiaries):

- Entities are used to track beneficiaries (=people who will benefit from the help an organization provides). Those
beneficiaries can be of different types (E.g.: Children under 5, Pregnant or lactating women, etc.).
- Those beneficiaries are visited multiple times, so multiple submissions/instances (that we call "records") are
attached to them via the entity_id foreign key of Instance.
- In addition to those records, we also want to track some core metadata about the beneficiary, such as their name,
age,... Because entities can be of very different natures, we avoid hardcoding those fields in the Entity model, and also reuse the form mechanism: each EntityType
has a foreign key to a reference form, and each entity has a foreign key (attributes) to an instance/submission of that
form.
"""

import json
import typing
import uuid

from copy import copy

from django.contrib.auth.models import AnonymousUser, User
from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Exists, OuterRef, Prefetch

from iaso.models import Account, Instance, OrgUnit, Project
from iaso.models.deduplication import ValidationStatus
from iaso.utils.jsonlogic import annotate_suffixed_json_fields, jsonlogic_to_q
from iaso.utils.models.soft_deletable import (
    DefaultSoftDeletableManager,
    IncludeDeletedSoftDeletableManager,
    OnlyDeletedSoftDeletableManager,
    SoftDeletableModel,
)

from .forms import Form


# TODO: Remove blank=True, null=True on FK once the models are sets and validated


class EntityType(models.Model):
    """Its `reference_form` describes the core attributes/metadata about the entity type (in case it refers to a person: name, age, ...)"""

    name = models.CharField(max_length=255)  # Example: "Child under 5"
    code = models.CharField(
        max_length=255, null=True, blank=True
    )  # As the name could change over the time, this field will never change once the entity type created and ETL script will rely on that
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Link to the reference form that contains the core attribute/metadata specific to this entity type
    reference_form = models.ForeignKey(Form, blank=True, null=True, on_delete=models.PROTECT)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, blank=True, null=True)
    is_active = models.BooleanField(default=False)
    # Fields (subset of the fields from the reference form) that will be shown in the UI - entity list view
    fields_list_view = ArrayField(
        models.CharField(max_length=255, blank=True, db_collation="case_insensitive"), size=100, null=True, blank=True
    )
    # Fields (subset of the fields from the reference form) that will be shown in the UI - entity detail view
    fields_detail_info_view = ArrayField(
        models.CharField(max_length=255, blank=True, db_collation="case_insensitive"), size=100, null=True, blank=True
    )
    # Fields (subset of the fields from the reference form) that will be used to search for duplicate entities
    fields_duplicate_search = ArrayField(
        models.CharField(max_length=255, blank=True, db_collation="case_insensitive"), size=100, null=True, blank=True
    )
    prevent_add_if_duplicate_found = models.BooleanField(
        default=False,
    )

    class Meta:
        unique_together = ["name", "account"]

    def __str__(self):
        return f"{self.name}"

    def as_dict(self):
        return {
            "name": self.name,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "reference_form": self.reference_form.as_dict(show_version=False) if self.reference_form else None,
            "account": self.account.as_dict(),
        }

    def get_list_view_fields(self) -> list:
        """
        Fetch the fields listed in `fields_list_view` from the reference form.

        Return an array of field descriptions (see `Form.possile_fields`):
        ```
        [
            {
                "name": "last_name",
                "type": "text",
                "label": "Nom de famille"
            },
            ...
        ]
        ```
        """

        if not self.reference_form or not self.reference_form.possible_fields:
            return []

        selected_fields = set(self.fields_list_view or [])
        if not selected_fields:
            return []

        fields = {}  # Used for deduplication by field name

        for field_data in self.reference_form.possible_fields:
            name = field_data.get("name")
            if name in selected_fields:
                # ODK start/end/calculate often have an empty label; fall back to name
                # so list/export columns remain displayable and serializer-valid.
                label = field_data.get("label") or name
                fields[name] = {**field_data, "label": label}

        return list(fields.values())


class InvalidLimitDateError(ValidationError):
    pass


class InvalidJsonContentError(ValidationError):
    pass


class UserNotAuthError(ValidationError):
    pass


class ProjectNotFoundError(ValidationError):
    pass


class EntityQuerySet(models.QuerySet):
    def _filter_entities_with_instances(self, *, limit_date=None, org_units_qs=None):
        """AND-combine, as *independent* conditions, an org-unit-scope check and a limit_date check
        against an entity's related instances: each condition gets its own correlated Exists(...),
        so a *different* instance of the same entity can satisfy each one (e.g. an old in-scope
        submission and a separate, more recent out-of-scope one both count -- the entity still
        qualifies for both). Folding both conditions into one shared `instances` queryset before a
        single Exists(...) would instead require a *single* instance to satisfy both simultaneously
        -- a real semantic difference, not just a query-shape detail (see
        test_list_entities_includes_entity_when_scope_and_recency_are_on_different_instances).

        org_units_qs is materialized into a concrete id list before filtering: even once
        _org_units_qs_for_user makes it cheap to *evaluate* on its own (see its docstring),
        embedding it here as `org_unit__in=org_units_qs` still leaves Postgres re-running that
        (constant, uncorrelated) subquery once per candidate instance row instead of hoisting it --
        unlike the array-subquery shape _org_units_qs_for_user avoids, Postgres doesn't cache this
        IN-subquery shape across rows either, so at real account scale (a full sync with no
        limit_date, ~396K candidate entities) that adds up to ~1.8M repeated point lookups against
        iaso_orgunit (measured ~97GB / 3.7s). A concrete id list sidesteps the question entirely --
        Postgres just probes iaso_instance_org_unit_entity_idx directly.
        """
        queryset = self

        if org_units_qs is not None:
            org_unit_ids = list(org_units_qs.values_list("id", flat=True))
            queryset = queryset.filter(
                Exists(Instance.non_deleted_objects.filter(org_unit_id__in=org_unit_ids, entity_id=OuterRef("pk")))
            )

        if limit_date:
            try:
                queryset = queryset.filter(
                    Exists(Instance.non_deleted_objects.filter(updated_at__gte=limit_date, entity_id=OuterRef("pk")))
                )
            except ValidationError:
                raise InvalidLimitDateError(f"Invalid limit date {limit_date}")

        return queryset

    def _org_units_qs_for_user(self, user):
        """Org unit hierarchy the user's profile is restricted to, or None if unrestricted.

        Passes a materialized `list(...)` of the profile's org units, not the QuerySet, to
        OrgUnit.objects.hierarchy(...): given a QuerySet, hierarchy() builds
        `path__descendants=ArraySubquery(...)`, i.e. a single `path <@ ARRAY(...)` check --
        ltree's GiST index isn't used for the array form once it has more than one element, so
        Postgres falls back to a full/parallel sequential scan of iaso_orgunit to enumerate
        descendants (measured ~1.3s / ~7.1GB touched on real prod data for a 7-org-unit profile,
        every 7-org-unit-array element scanned against the *whole* org unit table). Given a plain
        list instead, hierarchy() OR-combines one `path <@ single_value` check per org unit, and
        each of those individually *is* GiST-indexable (a BitmapOr of per-org-unit Bitmap Index
        Scans) -- same real profile: ~1.3s -> ~1.3ms, regardless of how many org units are
        directly assigned.
        """
        profile = user.iaso_profile
        if profile.org_units.exists():
            return OrgUnit.objects.hierarchy(list(profile.org_units.all()))
        return None

    def filter_for_mobile_entity(
        self,
        user: typing.Optional[typing.Union[User, AnonymousUser]],
        limit_date: typing.Optional[str] = None,
        json_content: typing.Optional[str] = None,
    ):
        """Entities queryset for the mobile app's normal sync: scoped to the user's account and
        their profile's org units, merged with limit_date/json_content, with the
        instances/attributes the mobile serializer needs prefetched."""
        return self._filter_for_mobile_entity(user, limit_date, json_content, restrict_to_user_org_units=True)

    def filter_for_mobile_entity_non_geo_restricted_search(
        self,
        user: typing.Optional[typing.Union[User, AnonymousUser]],
        limit_date: typing.Optional[str] = None,
        json_content: typing.Optional[str] = None,
    ):
        """Entities queryset for the mobile app's "online search" action (IA-3021): a user can find
        an entity that isn't scoped to their org units / synced to their device yet. This mode does
        not scope by account either (matching pre-existing behaviour of that action, which relies on
        the caller's own app_id/project scoping instead -- that scoping does not itself guarantee the
        account matches the requesting user's when the project has needs_authentication=False,
        tracked separately, not addressed by this method)."""
        return self._filter_for_mobile_entity(user, limit_date, json_content, restrict_to_user_org_units=False)

    def _filter_for_mobile_entity(
        self,
        user: typing.Optional[typing.Union[User, AnonymousUser]],
        limit_date: typing.Optional[str],
        json_content: typing.Optional[str],
        *,
        restrict_to_user_org_units: bool,
    ):
        if not user or not user.is_authenticated:
            raise UserNotAuthError("User not Authenticated")

        queryset = self
        org_units_qs = None
        if restrict_to_user_org_units:
            profile = user.iaso_profile
            queryset = queryset.filter(account=profile.account)
            org_units_qs = self._org_units_qs_for_user(user)

        # See _filter_entities_with_instances' docstring: org-unit scope and limit_date are applied
        # as two independent Exists(...) checks (a different instance can satisfy each), not merged
        # into one -- that's what keeps this correct for an entity whose in-scope activity and its
        # most recent activity happened on different instances.
        if org_units_qs is not None or limit_date:
            queryset = queryset._filter_entities_with_instances(org_units_qs=org_units_qs, limit_date=limit_date)

        if json_content:
            try:
                json_logic = json.loads(json_content)
                q, _ = jsonlogic_to_q(jsonlogic=json_logic, field_prefix="attributes__json__")  # type: ignore
                queryset, _ = annotate_suffixed_json_fields(queryset, json_logic, "attributes__json")
                queryset = queryset.filter(q)
            except ValidationError:
                raise InvalidJsonContentError(f"Invalid Json Content {json_content}")

        p = Prefetch(
            "instances",
            # order_by("id"): Instance has no Meta.ordering, so without this Postgres is free to return
            # these rows in a different order on each execution -- same instances, but a different order
            # in the mobile serializer's `instances` array every sync (see MobileEntitySerializer.get_instances).
            queryset=Instance.objects.filter(deleted=False, org_unit__validation_status=OrgUnit.VALIDATION_VALID)
            .exclude(file="")
            .order_by("id"),
        )

        queryset = queryset.filter(attributes_id__isnull=False, attributes__deleted=False)

        queryset = queryset.prefetch_related(p).prefetch_related("instances__form")

        return queryset

    def filter_for_user(self, user: typing.Optional[typing.Union[User, AnonymousUser]]):
        if not user or not user.is_authenticated:
            raise UserNotAuthError("User not Authenticated")

        profile = user.iaso_profile
        queryset = self.filter(account=profile.account)

        # we give all entities having an instance linked to the one of the org units allowed for the current user
        org_units_qs = self._org_units_qs_for_user(user)
        if org_units_qs is not None:
            queryset = queryset._filter_entities_with_instances(org_units_qs=org_units_qs)

        return queryset

    def filter_for_app_id(self, user: typing.Optional[typing.Union[User, AnonymousUser]], app_id: typing.Optional[str]):
        if not user or not user.is_authenticated:
            raise UserNotAuthError("User not Authenticated")

        try:
            project = Project.objects.get_for_user_and_app_id(user, app_id)

            if project.account is None:
                raise ProjectNotFoundError(f"Project Account is None for app_id {app_id}")  # Should be a 401

            return self.filter(entity_type__in=EntityType.objects.filter(reference_form__projects__app_id=app_id))
        except Project.DoesNotExist:
            raise ProjectNotFoundError(f"Project Not Found for app_id {app_id}")

    def filter_for_user_and_app_id(
        self,
        user: typing.Optional[typing.Union[User, AnonymousUser]],
        app_id: typing.Optional[str],
    ):
        return self.filter_for_user(user).filter_for_app_id(user, app_id)


class Entity(SoftDeletableModel):
    """An entity represents a physical object or person with a known Entity Type

    Contrary to forms, they are not linked to a specific OrgUnit.
    The core attributes that define this entity are not stored as fields in the Entity model, but in an Instance /
    submission
    """

    name = models.CharField(max_length=255, blank=True)  # this field is not used, name value is taken from attributes
    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    entity_type = models.ForeignKey(EntityType, blank=True, on_delete=models.PROTECT)
    attributes = models.OneToOneField(
        Instance, on_delete=models.PROTECT, help_text="instance", related_name="attributes", blank=True, null=True
    )
    account = models.ForeignKey(Account, on_delete=models.PROTECT)
    merged_to = models.ForeignKey("self", null=True, blank=True, on_delete=models.PROTECT)

    objects = DefaultSoftDeletableManager.from_queryset(EntityQuerySet)()

    objects_only_deleted = OnlyDeletedSoftDeletableManager.from_queryset(EntityQuerySet)()

    objects_include_deleted = IncludeDeletedSoftDeletableManager.from_queryset(EntityQuerySet)()

    class Meta:
        verbose_name_plural = "Entities"

    def __str__(self):
        return "%s %s %s %d" % (self.entity_type.name, self.uuid, self.name, self.id)

    def get_nfc_cards(self):
        from iaso.models.storage import StorageDevice

        nfc_count = StorageDevice.objects.filter(entity=self, type=StorageDevice.NFC).count()
        return nfc_count

    def as_small_dict(self):
        return {
            "id": self.pk,
            "uuid": self.uuid,
            "name": self.name,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "entity_type": self.entity_type_id,
            "entity_type_name": self.entity_type and self.entity_type.name,
            "attributes": self.attributes and self.attributes.as_dict(),
        }

    def as_small_dict_with_nfc_cards(self, instance):
        entity_dict = self.as_small_dict()
        entity_dict["nfc_cards"] = self.get_nfc_cards()
        return entity_dict

    def as_dict(self):
        instances = dict()

        for i in self.instances.all():
            instances["uuid"] = i.uuid
            instances["file_name"]: i.file_name
            instances[str(i.name)] = i.name

        return {
            "id": self.pk,
            "uuid": self.uuid,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "entity_type": self.entity_type.as_dict(),
            "attributes": self.attributes.as_dict(),
            "instances": instances,
            "account": self.account.as_dict(),
        }

    def soft_delete_with_instances_and_pending_duplicates(self, audit_source, user):
        """
        This method does a proper soft-deletion of the entity:
        - soft delete the entity
        - soft delete its attached form instances
        - delete relevant pending EntityDuplicate pairs
        """
        from hat.audit.models import log_modification
        from iaso.models.deduplication import ValidationStatus

        original = copy(self)
        self.delete()  # soft delete
        log_modification(original, self, audit_source, user=user)

        for instance in set(filter(None, [self.attributes] + list(self.instances.all()))):
            original = copy(instance)
            instance.soft_delete()
            log_modification(original, instance, audit_source, user=user)

        self.duplicates1.filter(validation_status=ValidationStatus.PENDING).delete()
        self.duplicates2.filter(validation_status=ValidationStatus.PENDING).delete()

        return self

    def get_pending_duplicate_ids(self):
        """Retrieve the id list of related pending duplicate entities."""
        results = set()
        if hasattr(self, "pending_duplicates1") and hasattr(self, "pending_duplicates2"):
            for duplicate in self.pending_duplicates1:
                results.add(duplicate.entity2_id)
            for duplicate in self.pending_duplicates2:
                results.add(duplicate.entity1_id)
            return list(results)

        e1qs = self.duplicates1.filter(validation_status=ValidationStatus.PENDING, entity2__deleted_at__isnull=True)
        e2qs = self.duplicates2.filter(validation_status=ValidationStatus.PENDING, entity1__deleted_at__isnull=True)
        for duplicate in e1qs:
            results.add(duplicate.entity2_id)
        for duplicate in e2qs:
            results.add(duplicate.entity1_id)
        return list(results)

    def get_latest_instance_created_at(self):
        """Retrieve the datetime of the last created instance for this entity."""
        instance_dates = (
            saved_at
            for instance in self.instances.all()
            if (saved_at := instance.source_created_at or instance.created_at) is not None
        )
        return max(instance_dates, default=self.created_at)
