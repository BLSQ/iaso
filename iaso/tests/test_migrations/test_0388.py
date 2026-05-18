from iaso.models import Account, AccountFeatureFlag
from iaso.modules import MODULE_VALIDATION_WORKFLOW
from iaso.test import IasoMigratorTestCase


class Test0388DirectMigration(IasoMigratorTestCase):
    migrate_from = ("iaso", "0387_merge_20260518_0937")
    migrate_to = ("iaso", "0388_alter_account_modules")
    num_queries = 15

    def prepare(self):
        # create FF
        self.vf_ff = AccountFeatureFlag.objects.get(
            code="SUBMISSION_VALIDATION_WORKFLOW",
            name="Web: Enable validation workflow",
        )

        self.other_ff = AccountFeatureFlag.objects.exclude(code="SUBMISSION_VALIDATION_WORKFLOW").first()

        self.assertIsNotNone(self.other_ff)

        # create some accounts
        self.account = Account.objects.create(name="account")
        self.account_with_vf_ff = Account.objects.create(name="account_with_vf_ff")
        self.account_with_vf_ff.feature_flags.add(self.vf_ff)

        self.account_with_vf_ff_and_others = Account.objects.create(name="account_with_vf_ff_and_others")
        self.account_with_vf_ff_and_others.feature_flags.set([self.other_ff, self.vf_ff])

        self.account_without_vf = Account.objects.create(name="account_without_vf")
        self.account_without_vf.feature_flags.add(self.other_ff)

    def test_migration(self):
        self.assertFalse(AccountFeatureFlag.objects.filter(code="SUBMISSION_VALIDATION_WORKFLOW").exists())

        self.account.refresh_from_db()
        self.assertEqual(self.account.modules, [])
        self.assertEqual(self.account.feature_flags.all().count(), 0)

        self.account_with_vf_ff.refresh_from_db()
        self.assertEqual(self.account_with_vf_ff.modules, [MODULE_VALIDATION_WORKFLOW.codename])
        self.assertEqual(self.account_with_vf_ff.feature_flags.all().count(), 0)

        self.account_with_vf_ff_and_others.refresh_from_db()
        self.assertEqual(self.account_with_vf_ff_and_others.modules, [MODULE_VALIDATION_WORKFLOW.codename])
        self.assertEqual(self.account_with_vf_ff_and_others.feature_flags.all().count(), 1)

        self.account_without_vf.refresh_from_db()
        self.assertEqual(self.account_without_vf.modules, [])
        self.assertEqual(self.account_without_vf.feature_flags.all().count(), 1)


class Test0388ReverseMigration(IasoMigratorTestCase):
    num_queries = 17

    migrate_to = ("iaso", "0387_merge_20260518_0937")
    migrate_from = ("iaso", "0388_alter_account_modules")

    def prepare(self):
        self.other_ff = AccountFeatureFlag.objects.exclude(code="SUBMISSION_VALIDATION_WORKFLOW").first()

        self.assertIsNotNone(self.other_ff)

        # create some accounts
        self.account = Account.objects.create(name="account")
        self.account_with_vf_ff = Account.objects.create(
            name="account_with_vf_ff", modules=[MODULE_VALIDATION_WORKFLOW.codename]
        )

        self.account_with_vf_ff_and_others = Account.objects.create(
            name="account_with_vf_ff_and_others", modules=[MODULE_VALIDATION_WORKFLOW.codename]
        )
        self.account_with_vf_ff_and_others.feature_flags.set([self.other_ff])

        self.account_without_vf = Account.objects.create(name="account_without_vf")
        self.account_without_vf.feature_flags.add(self.other_ff)

    def test_migration(self):
        self.assertTrue(AccountFeatureFlag.objects.filter(code="SUBMISSION_VALIDATION_WORKFLOW").exists())
        self.account.refresh_from_db()
        self.assertEqual(self.account.modules, [])
        self.assertEqual(self.account.feature_flags.all().count(), 0)

        self.account_with_vf_ff.refresh_from_db()
        self.assertEqual(self.account_with_vf_ff.modules, [MODULE_VALIDATION_WORKFLOW.codename])
        self.assertEqual(self.account_with_vf_ff.feature_flags.all().count(), 1)

        self.account_with_vf_ff_and_others.refresh_from_db()
        self.assertEqual(self.account_with_vf_ff_and_others.modules, [MODULE_VALIDATION_WORKFLOW.codename])
        self.assertEqual(self.account_with_vf_ff_and_others.feature_flags.all().count(), 2)

        self.account_without_vf.refresh_from_db()
        self.assertEqual(self.account_without_vf.modules, [])
        self.assertEqual(self.account_without_vf.feature_flags.all().count(), 1)
