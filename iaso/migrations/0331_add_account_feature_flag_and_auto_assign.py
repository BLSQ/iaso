from django.db import migrations


def create_and_assign_account_flag(apps, schema_editor):
    """Create SHOW_MOBILE_NO_ORGUNIT_PROJECT_FEATURE_FLAG and assign it to accounts with MOBILE_NO_ORG_UNIT projects"""
    Account = apps.get_model("iaso", "Account")
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")

    # Create the account feature flag
    account_flag, created = AccountFeatureFlag.objects.get_or_create(
        code="SHOW_MOBILE_NO_ORGUNIT_PROJECT_FEATURE_FLAG",
        defaults={"name": "Display no org units project feature flag"},
    )

    if created:
        print(f"Created account feature flag: {account_flag.code}")

    # Get the project feature flag (it should exist from previous migrations)
    try:
        project_flag = FeatureFlag.objects.get(code="MOBILE_NO_ORG_UNIT")
    except FeatureFlag.DoesNotExist:
        print("MOBILE_NO_ORG_UNIT feature flag not found, skipping auto-assignment")
        return

    # Find accounts that have projects with MOBILE_NO_ORG_UNIT feature flag
    accounts_with_mobile_no_org_unit = Account.objects.filter(project__feature_flags=project_flag).distinct()

    # Add the account feature flag to these accounts
    for account in accounts_with_mobile_no_org_unit:
        if account_flag not in account.feature_flags.all():
            account.feature_flags.add(account_flag)
            print(f"Added SHOW_MOBILE_NO_ORGUNIT_PROJECT_FEATURE_FLAG to account: {account.name}")
        else:
            print(f"Account {account.name} already has SHOW_MOBILE_NO_ORGUNIT_PROJECT_FEATURE_FLAG")


def reverse_create_and_assign_account_flag(apps, schema_editor):
    """Remove SHOW_MOBILE_NO_ORGUNIT_PROJECT_FEATURE_FLAG from all accounts and delete the flag"""
    Account = apps.get_model("iaso", "Account")
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")

    # Remove the flag from all accounts
    try:
        account_flag = AccountFeatureFlag.objects.get(code="SHOW_MOBILE_NO_ORGUNIT_PROJECT_FEATURE_FLAG")
        for account in Account.objects.all():
            account.feature_flags.remove(account_flag)
        account_flag.delete()
        print("Removed SHOW_MOBILE_NO_ORGUNIT_PROJECT_FEATURE_FLAG from all accounts and deleted the flag")
    except AccountFeatureFlag.DoesNotExist:
        print("SHOW_MOBILE_NO_ORGUNIT_PROJECT_FEATURE_FLAG not found, nothing to remove")


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0330_formversion_md5"),
    ]

    operations = [
        migrations.RunPython(create_and_assign_account_flag, reverse_create_and_assign_account_flag),
    ]
