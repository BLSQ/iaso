from rest_framework.test import APIRequestFactory

from hat.audit.models import Modification
from iaso import models as m
from iaso.api.instance_diff.serializers import InstanceModificationSerializer
from iaso.api.instance_diff.views import InstanceDiffViewSet
from iaso.tests.api.instance_diff.common import NEW_JSON, PAST_JSON, PII_CASES, BaseInstanceDiffPiiTestCase


class InstanceModificationSerializerPiiTestCase(BaseInstanceDiffPiiTestCase):
    def serialize(self, user, instance):
        """The single modification of the submission, serialized for this user."""
        request = APIRequestFactory().get("/")
        request.user = user
        instance = InstanceDiffViewSet().instance_queryset(m.Instance.objects.all()).get(id=instance.id)
        modifications = Modification.objects.filter(object_id=str(instance.id))
        return InstanceModificationSerializer(
            modifications, many=True, context={"request": request, "instance": instance}
        ).data[0]

    def test_pii_filtering(self):
        for case in PII_CASES:
            with self.subTest(case.name):
                modification = self.serialize(getattr(self, case.user), getattr(self, case.instance))
                self.assertVisibility(modification, case.visibility)

    def test_stored_snapshots_are_not_modified(self):
        self.serialize(self.user, self.no_whitelist_instance)
        modification = Modification.objects.get(object_id=str(self.no_whitelist_instance.id))
        self.assertEqual(modification.past_value[0]["fields"]["json"], PAST_JSON)
        self.assertEqual(modification.new_value[0]["fields"]["json"], NEW_JSON)
        self.assertIsNotNone(modification.past_value[0]["fields"]["file"])
