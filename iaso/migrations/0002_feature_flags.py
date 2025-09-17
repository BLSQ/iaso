from django.db import migrations


def create_account_feature_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")

    account_feature_flags = [
        ("ALLOW_SHAPE_EDITION", "Allow shape edition in Iaso UI"),
        ("ALLOW_CATCHMENT_EDITION", "Allow catchment shape edition in Iaso UI"),
        ("SHOW_PAGES", "Show page menu"),
        ("HIDE_PERIOD_QUARTER_NAME", "Hide quarter name in period on Iaso UI"),
        ("SHOW_DHIS2_LINK", "SHOW_DHIS2_LINK"),
        ("SHOW_LINK_INSTANCE_REFERENCE", "Show link the instance reference"),
        ("SHOW_BENEFICIARY_TYPES_IN_LIST_MENU", "Display beneficiaries by types in side menu"),
        ("SHOW_HOME_ONLINE", "Display plugin online home page"),
        ("SHOW_DEV_FEATURES", "Display dev features in web."),
        ("ENTITY_DUPLICATES_SOFT_DELETE", "Entity duplicates allow soft deletion instead of merging"),
        ("SHOW_MOBILE_NO_ORGUNIT_PROJECT_FEATURE_FLAG", "Display no org units project feature flag"),
    ]

    for aff in account_feature_flags:
        AccountFeatureFlag.objects.get_or_create(
            code=aff[0],
            defaults={"name": aff[1]},
        )


def create_feature_flags(apps, schema_editor):
    feature_flags = [
        {
            "code": "MOBILE_SUBMISSION_INCOMPLETE_BY_DEFAULT",
            "name": "Do not check 'Finalized' by default at the end of ODK forms",
            "requires_authentication": False,
            "description": "",
            "category": "DCO",
            "configuration_schema": None,
            "order": 6,
            "is_dangerous": False,
        },
        {
            "code": "MOBILE_CHANGE_REQUESTS_TAB",
            "name": "Mobile: Show change requests tab.",
            "requires_authentication": False,
            "description": "",
            "category": "DAV",
            "configuration_schema": {
                "test": {"type": "string", "default": "Hit me baby one more time", "description": "Whatever you want"}
            },
            "order": 15,
            "is_dangerous": False,
        },
        {
            "code": "REPORTS",
            "name": "Enable reports",
            "requires_authentication": False,
            "description": "",
            "category": "SPO",
            "configuration_schema": None,
            "order": 29,
            "is_dangerous": True,
        },
        {
            "code": "REQUIRE_AUTHENTICATION",
            "name": "Authentification",
            "requires_authentication": False,
            "description": "Require authentication to download & refresh data ( org. units, forms, etc ) in the mobile app",
            "category": "DCO",
            "configuration_schema": None,
            "order": 1,
            "is_dangerous": False,
        },
        {
            "code": "SHOW_DETAIL_MAP_ON_MOBILE",
            "name": "Mobile: Show map of OrgUnit",
            "requires_authentication": False,
            "description": "This is a new flag not yet fully available",
            "category": "GEO",
            "configuration_schema": None,
            "order": 12,
            "is_dangerous": False,
        },
        {
            "code": "SHOW_LINK_INSTANCE_REFERENCE",
            "name": "Show link instance reference",
            "requires_authentication": False,
            "description": "",
            "category": "DAV",
            "configuration_schema": None,
            "order": 17,
            "is_dangerous": False,
        },
        {
            "code": "WRITE_ON_NFC_CARDS",
            "name": "Use NFC card to save entity",
            "requires_authentication": False,
            "description": "",
            "category": "ENT",
            "configuration_schema": None,
            "order": 22,
            "is_dangerous": False,
        },
        {
            "code": "FORMS_AUTO_UPLOAD",
            "name": "Auto upload of finalized forms",
            "requires_authentication": False,
            "description": 'Uploader les formulaires dès qu\'une connexion internet se présente. Upload immédiat des formulaires "finalisés"',
            "category": "DCO",
            "configuration_schema": None,
            "order": 2,
            "is_dangerous": False,
        },
        {
            "code": "MOBILE_ENTITY_LIMITED_SEARCH",
            "name": "Mobile: Limit entities search.",
            "requires_authentication": False,
            "description": "",
            "category": "ENT",
            "configuration_schema": None,
            "order": 21,
            "is_dangerous": False,
        },
        {
            "code": "MOBILE_ENTITY_WARN_WHEN_FOUND",
            "name": "Mobile: Display a message when an entity is found in the duplicate search",
            "requires_authentication": False,
            "description": "",
            "category": "ENT",
            "configuration_schema": None,
            "order": 20,
            "is_dangerous": False,
        },
        {
            "code": "ENTITY",
            "name": "Mobile: Show entities screen",
            "requires_authentication": True,
            "description": "",
            "category": "ENT",
            "configuration_schema": None,
            "order": 18,
            "is_dangerous": False,
        },
        {
            "code": "TAKE_GPS_ON_FORM",
            "name": "GPS point for each form",
            "requires_authentication": False,
            "description": "",
            "category": "DCO",
            "configuration_schema": None,
            "order": 3,
            "is_dangerous": False,
        },
        {
            "code": "TRANSPORT_TRACKING",
            "name": "GPS for trajectory",
            "requires_authentication": False,
            "description": "",
            "category": "SPO",
            "configuration_schema": None,
            "order": 24,
            "is_dangerous": True,
        },
        {
            "code": "DATA_COLLECTION",
            "name": "Mobile: Show data collection screen",
            "requires_authentication": False,
            "description": "",
            "category": "DCO",
            "configuration_schema": None,
            "order": 4,
            "is_dangerous": False,
        },
        {
            "code": "PLANNING",
            "name": "Mobile: Show planning screen",
            "requires_authentication": True,
            "description": "",
            "category": "PLA",
            "configuration_schema": None,
            "order": 23,
            "is_dangerous": False,
        },
        {
            "code": "CHECK_POSITION_FOR_FORMS",
            "name": "Mobile: Enforce users are within reach of the Org Unit before starting a form.",
            "requires_authentication": False,
            "description": "",
            "category": "GEO",
            "configuration_schema": None,
            "order": 13,
            "is_dangerous": False,
        },
        {
            "code": "GPS_TRACKING",
            "name": "gps tracking",
            "requires_authentication": False,
            "description": "",
            "category": "SPO",
            "configuration_schema": None,
            "order": 25,
            "is_dangerous": True,
        },
        {
            "code": "LIMIT_OU_DOWNLOAD_TO_ROOTS",
            "name": "Mobile: Limit download of orgunit to what the user has access to",
            "requires_authentication": False,
            "description": "",
            "category": "REO",
            "configuration_schema": None,
            "order": 7,
            "is_dangerous": False,
        },
        {
            "code": "MOBILE_CHECK_FORMS_UPDATE",
            "name": "Mobile: Warn the user when forms have been updated.",
            "requires_authentication": False,
            "description": "",
            "category": "REO",
            "configuration_schema": None,
            "order": 11,
            "is_dangerous": False,
        },
        {
            "code": "MOBILE_CHECK_OU_UPDATE",
            "name": "Mobile: Warn the user when the Org Units have been updated.",
            "requires_authentication": False,
            "description": "",
            "category": "REO",
            "configuration_schema": None,
            "order": 10,
            "is_dangerous": False,
        },
        {
            "code": "MOBILE_ENTITY_NO_CREATION",
            "name": "Mobile: User cannot create a entity",
            "requires_authentication": False,
            "description": "",
            "category": "ENT",
            "configuration_schema": None,
            "order": 19,
            "is_dangerous": False,
        },
        {
            "code": "MOBILE_FINALIZED_FORM_ARE_READ",
            "name": "Mobile: Finalized forms are read only",
            "requires_authentication": False,
            "description": "When enabled, the finalized forms are displayed in read-only mode.",
            "category": "DCO",
            "configuration_schema": None,
            "order": 5,
            "is_dangerous": False,
        },
        {
            "code": "MOBILE_FORCE_FORMS_UPDATE",
            "name": "Mobile: Warn the user when forms have been updated and force them to update.",
            "requires_authentication": False,
            "description": "",
            "category": "REO",
            "configuration_schema": None,
            "order": 9,
            "is_dangerous": False,
        },
        {
            "code": "MOBILE_FORCE_OU_UPDATE",
            "name": "Mobile: Warn the user when the Org Units have been updated and force them to update.",
            "requires_authentication": False,
            "description": "",
            "category": "REO",
            "configuration_schema": None,
            "order": 8,
            "is_dangerous": False,
        },
        {
            "code": "MOBILE_HIDE_CLOSED_ORG_UNIT",
            "name": "Mobile: Hide closed OrgUnits.",
            "requires_authentication": False,
            "description": "",
            "category": "SPO",
            "configuration_schema": None,
            "order": 26,
            "is_dangerous": True,
        },
        {
            "code": "MOBILE_NO_ORG_UNIT",
            "name": "Mobile: 'No OrgUnits' Mode.",
            "requires_authentication": False,
            "description": "",
            "category": "SPO",
            "configuration_schema": None,
            "order": 28,
            "is_dangerous": True,
        },
        {
            "code": "MOBILE_ORG_UNIT_REGISTRY",
            "name": "Mobile: Change requests",
            "requires_authentication": True,
            "description": "",
            "category": "DAV",
            "configuration_schema": None,
            "order": 16,
            "is_dangerous": False,
        },
        {
            "code": "MOBILE_USE_ETHIOPIC_CALENDAR",
            "name": "Mobile: Use Ethiopic Calendar.",
            "requires_authentication": False,
            "description": "",
            "category": "SPO",
            "configuration_schema": None,
            "order": 27,
            "is_dangerous": True,
        },
        {
            "code": "MOBILE_SELECT_CLOSEST_ORG_UNIT",
            "name": "Mobile: Propose to jump to closest OrgUnit.",
            "requires_authentication": False,
            "description": "",
            "category": "GEO",
            "configuration_schema": None,
            "order": 14,
            "is_dangerous": False,
        },
    ]

    FeatureFlag = apps.get_model("iaso", "FeatureFlag")

    for ff in feature_flags:
        flag = FeatureFlag()
        flag.code = ff["code"]
        flag.name = ff["name"]
        flag.requires_authentication = ff["requires_authentication"]
        flag.description = ff["description"]
        flag.configuration_schema = ff["configuration_schema"]
        flag.category = ff["category"]
        flag.order = ff["order"]
        flag.is_dangerous = ff["is_dangerous"]
        flag.save()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_feature_flags, migrations.RunPython.noop, elidable=True),
        migrations.RunPython(create_account_feature_flag, migrations.RunPython.noop),
    ]
