from collections import defaultdict
from typing import Dict, Iterable, List, Optional, Tuple

from iaso.models import Instance, OrgUnit


class InstanceImportCache:
    """
    Lookups shared by all the instances of an import batch (e.g. a mobile bulk upload zip): done once for the whole
    batch instead of once per instance.

    - Instances: the ones already in the database for the batch's uuids, in a single query, plus the ones created
      while importing it (see `add_instance()`), so that a later entry of the batch with the same uuid finds them.
    - Org units given by uuid: looked up the first time they're seen (a batch typically covers a few facilities).
    """

    def __init__(self, instance_uuids: Iterable[Optional[str]]):
        # Lists: older instances can share a uuid (the unique index only covers recent ones). Ordered by id, so the
        # first one is the one `.first()` would pick.
        self._instances_by_uuid: Dict[str, List[Instance]] = defaultdict(list)
        for instance in Instance.objects.filter(uuid__in=[uuid for uuid in instance_uuids if uuid]).order_by("id"):
            self._instances_by_uuid[instance.uuid].append(instance)
        self._org_units: Dict[Tuple[str, Optional[int]], OrgUnit] = {}

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
