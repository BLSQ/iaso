from django.contrib.auth.models import Group
from rest_framework import serializers

from iaso.api.common.serializer import UserRoleNameSerializer
from iaso.api.common.serializer_fields import UserRoleNameField
from iaso.models import Account, UserRole
from iaso.test import TestCase


class UserRoleNameFieldTestSerializer(serializers.Serializer):
    name = UserRoleNameField(source="*", read_only=True)


class UserRoleNameFieldTestCase(TestCase):
    def setUp(self):
        self.account = Account.objects.create(name="test")

    def test_removes_account_prefix_from_group_name(self):
        group = Group.objects.create(name=f"{self.account.id}_data manager")
        user_role = UserRole.objects.create(account=self.account, group=group)

        self.assertEqual(UserRoleNameFieldTestSerializer(user_role).data, {"name": "data manager"})
    def test_keeps_group_name_without_matching_account_prefix(self):
        group = Group.objects.create(name="data_manager")
        user_role = UserRole.objects.create(account=self.account, group=group)

        self.assertEqual(UserRoleNameFieldTestSerializer(user_role).data, {"name": "data_manager"})

    def test_user_role_name_serializer_uses_shared_field(self):
        group = Group.objects.create(name=f"{self.account.id}_reviewer")
        user_role = UserRole.objects.create(account=self.account, group=group)

        self.assertEqual(UserRoleNameSerializer(user_role).data, {"id": user_role.pk, "name": "reviewer"})
