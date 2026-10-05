import uuid as uuid_lib

from collections import defaultdict
from typing import Dict, Iterable, List, Optional, Tuple

from iaso.models import Account, Entity, Instance, OrgUnit


EntityKey = Tuple[str, int]


class InstanceImportCache:
    """
    Lookups shared by all the instances of an import batch (e.g. a mobile bulk upload zip): done once for the whole
    batch instead of once per instance.

    - Instances: the ones already in the database for the batch's uuids, in a single query, plus the ones created
      while importing it (see `add_instance()`), so that a later entry of the batch with the same uuid finds them.
    - Org units given by uuid: looked up the first time they're seen (a batch typically covers a few facilities).
    - Entities: the ones already in the database for the batch's (entity uuid, entity type), in a single query (see
      `prefetch_entities()`), plus the ones created while importing it (see `add_entity()`).
    """

    def __init__(self, instance_uuids: Iterable[Optional[str]]):
        # Lists: older instances can share a uuid (the unique index only covers recent ones). Ordered by id, so the
        # first one is the one `.first()` would pick.
        # With their entity, read (never saved) when updating them: the entities the import saves are the ones from
        # `prefetch_entities()`.
        self._instances_by_uuid: Dict[str, List[Instance]] = defaultdict(list)
        existing = Instance.objects.filter(uuid__in=[uuid for uuid in instance_uuids if uuid]).select_related("entity")
        for instance in existing.order_by("id"):
            self._instances_by_uuid[instance.uuid].append(instance)
        self._org_units: Dict[Tuple[str, Optional[int]], OrgUnit] = {}
        # Lists too: older entities can share a uuid. Only for the keys given to `prefetch_entities()`.
        self._entities: Dict[EntityKey, List[Entity]] = {}

    def instances(self, uuid: str) -> List[Instance]:
        """All the instances with this uuid, oldest first."""
        return self._instances_by_uuid.get(uuid, [])

    def instance(self, uuid: str) -> Optional[Instance]:
        """The instance with this uuid, or None if there is none, or several."""
        instances = self.instances(uuid)
        return instances[0] if len(instances) == 1 else None

    def add_instance(self, instance: Instance) -> None:
        """Record an instance created (or given its uuid) while importing the batch."""
        self._instances_by_uuid[instance.uuid].append(instance)

    def org_unit(self, uuid: str, version_id: Optional[int]) -> OrgUnit:
        key = (uuid, version_id)
        if key not in self._org_units:
            self._org_units[key] = OrgUnit.objects.get(uuid=uuid, version_id=version_id)
        return self._org_units[key]

    def prefetch_entities(self, account: Account, entity_uuids_and_type_ids: Iterable[Tuple[str, str]]) -> None:
        """Look up, in a single query, the entities (even soft-deleted) of `account` for these (uuid, entity type)."""
        keys = {_entity_key(entity_uuid, entity_type_id) for entity_uuid, entity_type_id in entity_uuids_and_type_ids}
        keys.discard(None)
        if not keys:
            return
        for key in keys:
            self._entities[key] = []
        found = Entity.objects_include_deleted.filter(
            account=account,
            uuid__in={entity_uuid for entity_uuid, _ in keys},
            entity_type_id__in={entity_type_id for _, entity_type_id in keys},
        )
        for entity in found:
            key = _entity_key(entity.uuid, entity.entity_type_id)
            if key in self._entities:
                self._entities[key].append(entity)

    def entities(self, entity_uuid: str, entity_type_id: str) -> Optional[List[Entity]]:
        """The entities for this (uuid, entity type) - see `find_entity()` - or None if they weren't prefetched."""
        entities = self._entities.get(_entity_key(entity_uuid, entity_type_id))
        return list(entities) if entities is not None else None

    def add_entity(self, entity: Entity) -> None:
        """Record an entity created while importing the batch."""
        key = _entity_key(entity.uuid, entity.entity_type_id)
        if key:
            self._entities.setdefault(key, []).append(entity)


def _entity_key(entity_uuid, entity_type_id) -> Optional[EntityKey]:
    """(uuid, entity type id) normalized - the mobile app sends them as strings - or None if they aren't valid."""
    try:
        return str(uuid_lib.UUID(str(entity_uuid))), int(entity_type_id)
    except (TypeError, ValueError):
        return None
