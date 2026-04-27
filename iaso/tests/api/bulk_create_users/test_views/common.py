from unittest import mock

from django.core.files.storage import default_storage

from iaso import models as m
from iaso.modules import MODULES
from iaso.permissions.core_permissions import (
    CORE_SUBMISSIONS_PERMISSION,
    CORE_USERS_ADMIN_PERMISSION,
    CORE_USERS_MANAGED_PERMISSION,
    CORE_USERS_ROLES_PERMISSION,
)
from iaso.test import APITestCase


class BulkCreateBaseAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.source = m.DataSource.objects.create(name="Source")
        version1 = m.SourceVersion.objects.create(data_source=cls.source, number=1)
        version2 = m.SourceVersion.objects.create(data_source=cls.source, number=2)
        cls.MODULES = [module.codename for module in MODULES]
        account1 = m.Account.objects.create(name="Account 1", enforce_password_validation=False)
        cls.project = m.Project.objects.create(name="Project name", app_id="project.id", account=account1)
        cls.project2 = m.Project.objects.create(name="Project 2", app_id="project.2", account=account1)
        account1.default_version = version1
        account1.save()

        cls.yoda = cls.create_user_with_profile(
            username="yoda",
            account=account1,
            permissions=[CORE_SUBMISSIONS_PERMISSION, CORE_USERS_ADMIN_PERMISSION, CORE_USERS_ROLES_PERMISSION],
        )
        cls.obi = cls.create_user_with_profile(username="obi", account=account1)
        cls.john = cls.create_user_with_profile(username="johndoe", account=account1, is_superuser=True)

        cls.org_unit_type_region = m.OrgUnitType.objects.create(name="Region")
        cls.org_unit_type_region.projects.add(cls.project)
        cls.org_unit_type_country = m.OrgUnitType.objects.create(name="Country")
        cls.org_unit_type_country.projects.add(cls.project)

        cls.org_unit_parent = m.OrgUnit.objects.create(
            name="Parent org unit", id=1111, version=version1, source_ref="foo"
        )
        cls.org_unit_child = m.OrgUnit.objects.create(
            name="Child org unit", id=1112, version=version1, source_ref="foo", parent=cls.org_unit_parent
        )

        cls.user_managed_geo_limit = cls.create_user_with_profile(
            username="user_managed_geo_limit",
            account=account1,
            permissions=[CORE_USERS_MANAGED_PERMISSION],
        )

        cls.org_unit1 = m.OrgUnit.objects.create(name="Coruscant Jedi Council", version=version1, source_ref="foo")
        cls.org_unit2 = m.OrgUnit.objects.create(name="Tatooine", version=version1, source_ref="bar")
        cls.org_unit3 = m.OrgUnit.objects.create(name="Dagobah", id=9999, version=version1, source_ref="baz")
        cls.org_unit4 = m.OrgUnit.objects.create(name="Solana", version=version1)

        cls.yoda.iaso_profile.org_units.set([cls.org_unit1, cls.org_unit2, cls.org_unit3, cls.org_unit4])

        m.OrgUnit.objects.create(name="chiloe", id=10244, version=version1, parent=cls.org_unit2)
        m.OrgUnit.objects.create(name="chiloe", id=10934, version=version2)

        account2 = m.Account.objects.create(name="Account 2", enforce_password_validation=False)
        cls.create_user_with_profile(
            username="han solo",
            account=account2,
            permissions=[CORE_SUBMISSIONS_PERMISSION, CORE_USERS_ADMIN_PERMISSION],
        )

        cls.version1 = version1
        cls.version2 = version2
        cls.account1 = account1

    def setUp(self):
        # Removing all InMemoryFileNodes inside the storage to avoid name conflicts - some can be kept by previous test classes
        default_storage._root._children.clear()  # see InMemoryFileStorage in django/core/files/storage/memory.py
        super().setUp()

        patcher = mock.patch("magic.from_buffer", return_value="text/csv")
        self.mock_from_buffer = patcher.start()
        self.addCleanup(patcher.stop)
