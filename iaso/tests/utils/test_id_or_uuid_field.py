from rest_framework.exceptions import ValidationError

from iaso.test import APITestCase
from iaso.utils.serializer.id_or_uuid_field import IdOrUuidRelatedField
from iaso import models as m


class IdOrUuidRelatedFieldTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.org_unit1 = m.OrgUnit.objects.create(uuid="1539f174-4c53-499c-85de-111111111111")
        cls.org_unit2 = m.OrgUnit.objects.create(uuid="1539f174-4c53-499c-85de-222222222222")
        cls.org_unit3 = m.OrgUnit.objects.create(uuid="1539f174-4c53-499c-85de-333333333333")
        cls.queryset = m.OrgUnit.objects.all()
        cls.field = IdOrUuidRelatedField(queryset=cls.queryset)

    def test_to_internal_value_by_id(self):
        data = self.org_unit1.pk
        value = self.field.to_internal_value(data)
        self.assertEqual(value, self.org_unit1)

    def test_to_internal_value_by_uuid(self):
        data = self.org_unit2.uuid
        value = self.field.to_internal_value(data)
        self.assertEqual(value, self.org_unit2)

    def test_to_internal_value_by_id_as_str(self):
        data = str(self.org_unit3.pk)
        value = self.field.to_internal_value(data)
        self.assertEqual(value, self.org_unit3)

    def test_to_internal_value_invalid(self):
        data = None
        with self.assertRaises(ValidationError) as error:
            self.field.to_internal_value(data)
        self.assertIn('Invalid pk or uuid "None" - object does not exist.', error.exception.detail)

        data = True
        with self.assertRaises(ValidationError) as error:
            self.field.to_internal_value(data)
        self.assertIn('Invalid pk or uuid "True" - object does not exist.', error.exception.detail)

        data = ""
        with self.assertRaises(ValidationError) as error:
            self.field.to_internal_value(data)
        self.assertIn('Invalid pk or uuid "" - object does not exist.', error.exception.detail)

    def test_to_representation(self):
        data = self.org_unit3
        value = self.field.to_representation(data)
        self.assertEqual(value, self.org_unit3.pk)
