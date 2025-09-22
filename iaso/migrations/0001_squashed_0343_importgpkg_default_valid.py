import uuid

import django.contrib.gis.db.models.fields
import django.contrib.postgres.fields
import django.contrib.postgres.indexes
import django.core.validators
import django.db.models.deletion
import django_ltree.fields
import phonenumber_field.modelfields

from django.conf import settings
from django.contrib.postgres.operations import CreateExtension
from django.db import migrations, models

import iaso.models.base
import iaso.utils.dhis2


class Migration(migrations.Migration):
    replaces = [
        ("iaso", "0001_squashed_0026_adding_indexes_on_org_unit"),
        ("iaso", "0002_auto_20191001_1142_squashed_0100_auto_20210702_0835"),
        ("iaso", "0101_page_needs_authentication_squashed_0110_make_readonlyrole"),
        ("iaso", "0111_page_account"),
        ("iaso", "0112_entity_entitytype"),
        ("iaso", "0113_auto_20220117_1607"),
        ("iaso", "0114_auto_20220117_1609"),
        ("iaso", "0115_auto_20220124_1120"),
        ("iaso", "0116_auto_20220124_1342"),
        ("iaso", "0117_auto_20220124_1735"),
        ("iaso", "0118_entity_deleted_at"),
        ("iaso", "0119_auto_20220126_1823"),
        ("iaso", "0120_auto_20220126_1826"),
        ("iaso", "0121_entity_account"),
        ("iaso", "0122_auto_20220126_1912"),
        ("iaso", "0112_auto_20220110_1503"),
        ("iaso", "0113_add_account_feature_flag_quarter"),
        ("iaso", "0119_merge_20220126_1655"),
        ("iaso", "0123_merge_20220126_1921"),
        ("iaso", "0124_orgunittype_form_defining"),
        ("iaso", "0124_orgunitaslocationcache"),
        ("iaso", "0125_merge_20220304_1510"),
        ("iaso", "0124_profile_dhis2_id"),
        ("iaso", "0125_auto_20220307_1632"),
        ("iaso", "0126_merge_20220317_1305"),
        ("iaso", "0125_matchingalgorithm_projects"),
        ("iaso", "0127_merge_20220322_1012"),
        ("iaso", "0128_orgunit_instance_defining"),
        ("iaso", "0128_auto_20220324_1212"),
        ("iaso", "0129_merge_20220328_0559"),
        ("iaso", "0127_delete_orgunitaslocationcache"),
        ("iaso", "0130_merge_20220329_0814"),
        ("iaso", "0126_auto_20220309_1553"),
        ("iaso", "0127_auto_20220309_1601"),
        ("iaso", "0131_merge_20220412_0752"),
        ("iaso", "0130_importgpkg_description"),
        ("iaso", "0132_merge_20220412_1136"),
        ("iaso", "0133_auto_20220418_1321"),
        ("iaso", "0134_auto_20220419_0717"),
        ("iaso", "0111_auto_20220106_1725"),
        ("iaso", "0112_auto_20220110_0925"),
        ("iaso", "0113_merge_20220117_1306"),
        ("iaso", "0130_merge_20220410_1802"),
        ("iaso", "0125_merge_20220307_1107"),
        ("iaso", "0130_merge_20220401_1428"),
        ("iaso", "0133_merge_20220413_1156"),
        ("iaso", "0135_merge_20220510_1619"),
        ("iaso", "0136_auto_20220511_0925"),
        ("iaso", "0133_add_dhis2_ling_feature_flag"),
        ("iaso", "0134_merge_20220510_1428"),
        ("iaso", "0137_merge_20220516_0832"),
        ("iaso", "0134_team"),
        ("iaso", "0138_merge_0134_team_0137_merge_20220516_0832"),
        ("iaso", "0139_planning"),
        ("iaso", "0140_auto_20220519_1249"),
        ("iaso", "0138_bulkcreateusercsvfile"),
        ("iaso", "0139_bulkcreateusercsvfile_account"),
        ("iaso", "0141_merge_20220530_0808"),
        ("iaso", "0141_auto_20220520_1239"),
        ("iaso", "0142_merge_20220530_0856"),
        ("iaso", "0142_assignment"),
        ("iaso", "0143_merge_0142_assignment_0142_merge_20220530_0856"),
        ("iaso", "0144_alter_assignment_options"),
        ("iaso", "0143_add_microplanning_feature_flag"),
        ("iaso", "0145_merge_20220608_0900"),
        ("iaso", "0146_team_path"),
        ("iaso", "0147_calculate_team_path"),
        ("iaso", "0148_alter_team_path"),
        ("iaso", "0144_add_show_link_instance_reference"),
        ("iaso", "0149_merge_20220614_1706"),
        ("iaso", "0150_profile_home_page"),
        ("iaso", "0151_auto_20220718_1013"),
        ("iaso", "0152_auto_20220802_1408"),
        ("iaso", "0153_entitytype_account"),
        ("iaso", "0154_auto_20220804_0843"),
        ("iaso", "0155_alter_entitytype_unique_together"),
        ("iaso", "0156_auto_20220817_0910"),
        ("iaso", "0157_auto_20220817_1136"),
        ("iaso", "0158_alter_instance_entity"),
        ("iaso", "0156_alter_entity_attributes"),
        ("iaso", "0159_merge_20220817_1233"),
        ("iaso", "0152_project_min_version"),
        ("iaso", "0160_merge_20220819_1239"),
        ("iaso", "0161_rename_fields_detail_view_entitytype_fields_detail_info_view"),
        ("iaso", "0151_auto_20220718_1359"),
        ("iaso", "0152_merge_0151_auto_20220718_1013_0151_auto_20220718_1359"),
        ("iaso", "0153_merge_20220819_1352"),
        ("iaso", "0161_merge_20220829_0920"),
        ("iaso", "0162_merge_20220901_1052"),
        ("iaso", "0153_instancelock"),
        ("iaso", "0163_merge_0153_instancelock_0162_merge_20220901_1052"),
        ("iaso", "0164_alter_instancelock_options"),
        ("iaso", "0161_entitytype_is_active"),
        ("iaso", "0162_merge_20220901_0953"),
        ("iaso", "0163_merge_20220902_1635"),
        ("iaso", "0165_merge_20220906_1200"),
        ("iaso", "0161_alter_account_name"),
        ("iaso", "0163_merge_20220902_1037"),
        ("iaso", "0166_merge_20220908_1445"),
        ("iaso", "0165_merge_20220909_0753"),
        ("iaso", "0167_merge_20220909_1207"),
        ("iaso", "0168_storagedevice_storagelogentry"),
        ("iaso", "0169_alter_storagelogentry_device"),
        ("iaso", "0170_auto_20221012_1311"),
        ("iaso", "0168_alter_instance_accuracy"),
        ("iaso", "0171_merge_20221013_0805"),
        ("iaso", "0172_auto_20221013_1046"),
        ("iaso", "0173_storagedevice_org_unit"),
        ("iaso", "0174_auto_20221025_1354"),
        ("iaso", "0175_storagelogentry_status_comment"),
        ("iaso", "0176_storagedevice_status_updated_at"),
        ("iaso", "0177_delete_iaso_beneficiaries"),
        ("iaso", "0178_remove_beneficiary_user_perm"),
        ("iaso", "0179_alter_form_period_type"),
        ("iaso", "0180_workflow_workflowchange_workflowfollowup_workflowversion"),
        ("iaso", "0181_auto_20221208_1104"),
        ("iaso", "0182_alter_workflowfollowup_condition"),
        ("iaso", "0183_set_storagedevice_status_updated_at"),
        ("iaso", "0184_alter_storagedevice_status_updated_at"),
        ("iaso", "0185_merge_20221213_0910"),
        ("iaso", "0186_report_reportversion"),
        ("iaso", "0187_reportversion_status"),
        ("iaso", "0188_alter_reportversion_file"),
        ("iaso", "0186_workflowversion_deleted_at"),
        ("iaso", "0189_merge_20230109_1747"),
        ("iaso", "0190_sourceversion_unique_number_data_source_version"),
        ("iaso", "0191_page_powerbi_language"),
        ("iaso", "0187_remove_workflowversion_reference_form"),
        ("iaso", "0190_merge_20230120_1227"),
        ("iaso", "0191_merge_20230125_1559"),
        ("iaso", "0192_merge_20230131_1353"),
        ("iaso", "0192_instance_planning"),
        ("iaso", "0193_merge_0192_instance_planning_0192_merge_20230131_1353"),
        ("iaso", "0191_remove_account_users"),
        ("iaso", "0192_merge_20230131_1306"),
        ("iaso", "0194_merge_20230221_0956"),
        ("iaso", "0195_entitytype_fields_duplicate_search"),
        ("iaso", "0196_storagepassword"),
        ("iaso", "0197_formpredefinedfilter"),
        ("iaso", "0198_formversion_possible_fields"),
        ("iaso", "0199_data_migration_form_version_possible_fields"),
        ("iaso", "0200_jsondatastore"),
        ("iaso", "0201_alter_jsondatastore_content"),
        ("iaso", "0202_auto_20230419_1444"),
        ("iaso", "0203_group_to_display"),
        ("iaso", "0204_rename_to_display_group_block_of_countries"),
        ("iaso", "0198_instance_form_version"),
        ("iaso", "0205_merge_20230504_1352"),
        ("iaso", "0206_alter_planning_forms"),
        ("iaso", "0206_add_feature_flag_LIMIT_OU_DOWNLOAD_TO_ROOTS"),
        ("iaso", "0207_merge_20230517_1226"),
        ("iaso", "0207_formattachment"),
        ("iaso", "0208_merge_0207_formattachment_0207_merge_20230517_1226"),
        ("iaso", "0198_entityduplicate_entityduplicateanalyze"),
        ("iaso", "0199_auto_20230331_0937"),
        ("iaso", "0200_auto_20230419_0846"),
        ("iaso", "0206_merge_20230508_0829"),
        ("iaso", "0205_merge_20230505_0828"),
        ("iaso", "0207_merge_20230508_0849"),
        ("iaso", "0208_merge_0207_formattachment_0207_merge_20230508_0849"),
        ("iaso", "0209_merge_20230605_1312"),
        ("iaso", "0210_auto_20230605_1314"),
        ("iaso", "0211_auto_20230606_1322"),
        ("iaso", "0207_orgunittype_allow_creating_sub_unit_types"),
        ("iaso", "0209_merge_20230602_1002"),
        ("iaso", "0212_merge_20230608_1352"),
        ("iaso", "0213_auto_20230612_0825"),
        ("iaso", "0214_alter_entityduplicateanalyzis_task"),
        ("iaso", "0210_userrole"),
        ("iaso", "0215_merge_20230613_1512"),
        ("iaso", "0209_alter_orgunit_validation_status"),
        ("iaso", "0210_alter_orgunit_validation_status"),
        ("iaso", "0216_merge_20230614_0839"),
        ("iaso", "0217_add_feature_flag_MOBILE_CHECK_FORMS_UPDATE"),
        ("iaso", "0218_add_feature_flag_MOBILE_CHECK_OU_UPDATE"),
        ("iaso", "0219_add_feature_flag_MOBILE_FORCE_FORMS_UPDATE"),
        ("iaso", "0220_add_feature_flag_MOBILE_FORCE_OU_UPDATE"),
        ("iaso", "0217_fill_allow_creating_sub_unit_types"),
        ("iaso", "0221_merge_20230630_0710"),
        ("iaso", "0217_profile_user_roles"),
        ("iaso", "0216_profile_projects"),
        ("iaso", "0217_merge_0216_merge_20230614_0839_0216_profile_projects"),
        ("iaso", "0218_merge_20230621_0850"),
        ("iaso", "0219_alter_profile_projects"),
        ("iaso", "0218_merge_20230627_1233"),
        ("iaso", "0220_merge_20230628_1038"),
        ("iaso", "0221_alter_featureflag_code"),
        ("iaso", "0222_merge_20230718_1500"),
        ("iaso", "0222_merge_20230718_1414"),
        ("iaso", "0223_merge_20230718_1530"),
        ("iaso", "0222_merge_20230718_1321"),
        ("iaso", "0224_merge_20230719_1238"),
        ("iaso", "0223_merge_20230718_1708"),
        ("iaso", "0225_merge_20230719_1411"),
        ("iaso", "0222_merge_20230718_1344"),
        ("iaso", "0223_merge_20230719_0755"),
        ("iaso", "0226_merge_20230724_1245"),
        ("iaso", "0227_featureflag_requires_authentication"),
        ("iaso", "0227_add_account_feature_flag_SHOW_BENEFICIARY_TYPES_IN_LIST_MENU"),
        ("iaso", "0228_merge_20230829_1045"),
        ("iaso", "0228_account_user_manual_path"),
        ("iaso", "0229_merge_20230829_1408"),
        ("iaso", "0227_page_powerbi_dataset_id"),
        ("iaso", "0229_merge_20230829_1353"),
        ("iaso", "0230_merge_20230829_2057"),
        ("iaso", "0227_add_uuid_field_20230824_1444"),
        ("iaso", "0228_populate_uuid_values_20230824_1448"),
        ("iaso", "0229_remove_uuid_null_20230824_1448"),
        ("iaso", "0231_merge_20230904_2154"),
        ("iaso", "0232_add_reference_forms_and_reference_instances"),
        ("iaso", "0233_migrate_data_to_reference_forms_and_reference_instances"),
        ("iaso", "0234_delete_reference_form_and_reference_instance"),
        ("iaso", "0232_task_external"),
        ("iaso", "0235_merge_20231006_0940"),
        ("iaso", "0236_account_modules"),
        ("iaso", "0237_add_modules_to_all_existing_accounts"),
        ("iaso", "0238_alter_account_modules"),
        ("iaso", "0236_auto_20231012_0955"),
        ("iaso", "0239_merge_20231017_1610"),
        ("iaso", "0237_add_account_feature_flag_SHOW_HOME_ONLINE"),
        ("iaso", "0240_merge_20231020_1142"),
        ("iaso", "0238_rename_new_accuracy_orgunitchangerequest_new_location_accuracy_uuid"),
        ("iaso", "0241_merge_20231026_0703"),
        ("iaso", "0239_add_feature_flag_ORG_UNIT_CHANGE_REQUEST"),
        ("iaso", "0242_merge_20231026_0921"),
        ("iaso", "0243_form_legend_threshold"),
        ("iaso", "0244_alter_form_legend_threshold"),
        ("iaso", "0243_alter_instance_planning"),
        ("iaso", "0245_merge_20231113_0947"),
        ("iaso", "0244_add_opening_and_closed_date_in_org_unit"),
        ("iaso", "0245_auto_20231123_0912"),
        ("iaso", "0246_merge_20231128_1158"),
        ("iaso", "0243_auto_20231109_1219"),
        ("iaso", "0244_merge_20231110_0907"),
        ("iaso", "0246_merge_20231124_1048"),
        ("iaso", "0247_merge_20231205_0938"),
        ("iaso", "0247_auto_20231129_1300"),
        ("iaso", "0248_merge_20231205_1038"),
        ("iaso", "0246_add_feature_flags"),
        ("iaso", "0248_merge_0246_add_feature_flags_0247_merge_20231205_0938"),
        ("iaso", "0249_merge_20231205_1120"),
        ("iaso", "0250_jsondatastore_org_unit_20231211_1016"),
        ("iaso", "0250_add_analytics_script_to_pages"),
        ("iaso", "0251_merge_20231212_0857"),
        ("iaso", "0252_remove_analytics_script_field_from_page"),
        ("iaso", "0253_add_analytics_script_field_into_account"),
        ("iaso", "0252_alter_jsondatastore_org_unit"),
        ("iaso", "0254_merge_20240108_1001"),
        ("iaso", "0255_case_insensitive_collation"),
        ("iaso", "0256_upgrade_to_django_4"),
        ("iaso", "0257_remove_orgunitchangerequest_reviewed_at_and_more"),
        ("iaso", "0258_orgunitchangerequest_old_closed_date_and_more"),
        ("iaso", "0259_alter_orgunitchangerequest_created_at_and_more"),
        ("iaso", "0260_auto_20240118_0948"),
        ("iaso", "0261_config"),
        ("iaso", "0262_alter_entity_name"),
        ("iaso", "0263_form_change_request_mode"),
        ("iaso", "0264_data_delete_change_requests_duplicates_uuid"),
        ("iaso", "0265_alter_orgunitchangerequest_uuid"),
        ("iaso", "0264_profile_phone_number"),
        ("iaso", "0264_payment_potentialpayment"),
        ("iaso", "0266_merge_20240311_1034"),
        ("iaso", "0265_merge_20240228_1725"),
        ("iaso", "0267_merge_20240311_1616"),
        ("iaso", "0268_remove_payment_change_requests_and_more"),
        ("iaso", "0269_auto_20240314_1326"),
        ("iaso", "0270_auto_20240314_1515"),
        ("iaso", "0271_potentialpayment_payment_lot"),
        ("iaso", "0272_paymentlot_task"),
        ("iaso", "0271_upgrade_postgis_extensions_20240325_1139"),
        ("iaso", "0273_merge_20240327_0931"),
        ("iaso", "0272_orgunit_extra_fields_and_more"),
        ("iaso", "0274_merge_20240327_1257"),
        ("iaso", "0275_orgunitchangerequest_stored_requested_fields"),
        ("iaso", "0276_data_populate_requested_fields"),
        ("iaso", "0277_rename_stored_requested_fields_orgunitchangerequest_requested_fields"),
        ("iaso", "0278_alter_form_periods_after_allowed_and_more"),
        ("iaso", "0278_alter_account_modules"),
        ("iaso", "0279_merge_20240417_1319"),
        ("iaso", "0280_datasource_tree_config_status_fields"),
        ("iaso", "0281_replace_registry_permission_by_read_and_write_to_users_permission"),
        ("iaso", "0282_replace_planning_permission_by_read_and_write_to_users_permission"),
        ("iaso", "0281_alter_account_modules"),
        ("iaso", "0283_merge_20240603_0930"),
        ("iaso", "0284_replace_registry_permission_by_read_and_write_to_user_roles_permission"),
        ("iaso", "0285_replace_planning_permission_by_read_and_write_to_user_roles_permission"),
        ("iaso", "0286_entitytype_prevent_add_if_duplicate_found"),
        ("iaso", "0287_instance_source_created_at_and_more"),
        ("iaso", "0288_fill_instance_source_created_at"),
        ("iaso", "0289_fill_instance_source_updated_at"),
        ("iaso", "0290_fill_orgunit_source_created_at"),
        ("iaso", "0291_instance_iaso_instan_created_04174a_idx_and_more"),
        ("iaso", "0287_auto_20240703_1253"),
        ("iaso", "0292_merge_20240717_1016"),
        ("iaso", "0293_orgunitchangerequest_kind"),
        ("iaso", "0294_project_redirection_url"),
        ("iaso", "0293_datasource_public"),
        ("iaso", "0295_merge_20240819_1249"),
        ("iaso", "0296_orgunit_default_image"),
        ("iaso", "0296_groupset_group_belonging"),
        ("iaso", "0296_alter_account_modules"),
        ("iaso", "0297_merge_20240913_0900"),
        ("iaso", "0298_profile_organization"),
        ("iaso", "0297_entity_merged_to"),
        ("iaso", "0299_merge_0297_entity_merged_to_0298_profile_organization"),
        ("iaso", "0296_orgunitchangerequestconfiguration"),
        ("iaso", "0300_merge_20240916_1512"),
        ("iaso", "0300_add_code_field_to_entity_type"),
        ("iaso", "0301_merge_20241002_1206"),
        ("iaso", "0300_entity_duplicates_feature_flag"),
        ("iaso", "0301_merge_20241002_0941"),
        ("iaso", "0302_merge_20241003_0911"),
        ("iaso", "0301_potentialpayment_task"),
        ("iaso", "0303_merge_20241003_1256"),
        ("iaso", "0304_profile_org_unit_types"),
        ("iaso", "0305_userrole_editable_org_unit_types"),
        ("iaso", "0304_auto_20241015_1017"),
        ("iaso", "0306_merge_20241024_0902"),
        ("iaso", "0295_tenantuser_tenantuser_main_user_user_constraint"),
        ("iaso", "0300_merge_20240916_1441"),
        ("iaso", "0304_merge_20241009_1240"),
        ("iaso", "0307_merge_20241024_1145"),
        ("iaso", "0305_alter_potentialpayment_user"),
        ("iaso", "0308_merge_20241028_1145"),
        ("iaso", "0309_alter_potentialpayment_user"),
        ("iaso", "0310_alter_orgunitchangerequestconfiguration_project"),
        ("iaso", "0311_alter_tenantuser_account_user_and_more"),
        ("iaso", "0300_alter_page_type"),
        ("iaso", "0312_merge_20241206_1243"),
        ("iaso", "0313_page_superset_dashboard_id_and_more"),
        ("iaso", "0314_task_created_by_task_iaso_task_account_72f14f_idx_and_more"),
        ("iaso", "0315_datasourceversionssynchronization_and_more"),
        ("iaso", "0314_alter_form_period_type"),
        ("iaso", "0315_alter_form_period_type"),
        ("iaso", "0316_merge_20250121_1321"),
        ("iaso", "0317_alter_account_modules"),
        ("iaso", "0318_add_data_validation_module_to_accounts"),
        ("iaso", "0319_orgunitchangerequestconfiguration_type"),
        ("iaso", "0320_alter_orgunit_extra_fields"),
        ("iaso", "0321_formattachment_file_last_scan_and_more"),
        ("iaso", "0322_alter_orgunit_org_unit_type_and_more"),
        ("iaso", "0323_account_custom_translations"),
        ("iaso", "0324_project_color"),
        ("iaso", "0324_auto_20250514_1244"),
        ("iaso", "0325_merge_0324_auto_20250514_1244_0324_project_color"),
        ("iaso", "0326_alter_project_app_id"),
        ("iaso", "0327_orgunitchangerequest_deleted_at"),
        ("iaso", "0328_auto_20250619_1436"),
        ("iaso", "0329_orgunit_code_and_more"),
        ("iaso", "0330_formversion_md5"),
        ("iaso", "0331_remove_importgpkg_project"),
        ("iaso", "0331_add_account_feature_flag_and_auto_assign"),
        ("iaso", "0332_merge_20250717_1033"),
        ("iaso", "0333_alter_group_options_alter_group_managers"),
        ("iaso", "0334_remove_group_domain_values"),
        ("iaso", "0335_remove_group_domain"),
        ("iaso", "0333_corepermissionsupport"),
        ("iaso", "0334_split_core_permissions_from_hat"),
        ("iaso", "0335_alter_entityduplicateanalyzis_algorithm"),
        ("iaso", "0336_merge_20250731_0902"),
        ("iaso", "0337_featureflag_category_featureflag_is_dangerous_and_more"),
        ("iaso", "0338_metrictype_metricvalue"),
        ("iaso", "0339_add_deduplication_indexes"),
        ("iaso", "0340_formversion_created_by_formversion_updated_by"),
        ("iaso", "0340_featureflag_configuration_projectfeatureflags_and_more"),
        ("iaso", "0341_merge_20250825_0807"),
        ("iaso", "0342_reportversion_created_by_reportversion_updated_by_and_more"),
        ("iaso", "0343_importgpkg_default_valid"),
    ]

    initial = True

    dependencies = [
        ("sites", "0002_alter_domain_unique"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        CreateExtension("citext"),
        CreateExtension("ltree"),
        # Now create the collation
        migrations.RunSQL(
            """
            -- This SQL creates a case-insensitive collation
            CREATE COLLATION IF NOT EXISTS case_insensitive (
                PROVIDER = 'icu',
                LOCALE = 'en-US-u-ks-level2',
                DETERMINISTIC = FALSE
            );
            """,
            # You should also add a reverse SQL command for un-doing this
            reverse_sql="""
            DROP COLLATION IF EXISTS case_insensitive;
            """,
        ),
        migrations.CreateModel(
            name="CorePermissionSupport",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ],
            options={
                "permissions": (
                    ("iaso_forms", "Formulaires"),
                    ("iaso_forms_stats", "Statistiques pour les formulaires"),
                    ("iaso_mappings", "Correspondances avec DHIS2"),
                    ("iaso_modules", "modules"),
                    ("iaso_completeness", "Complétude des données"),
                    ("iaso_org_units", "Unités d'organisations"),
                    ("iaso_org_units_history", "Historique des unités d'organisation"),
                    ("iaso_org_units_read", "Lire les unités d'organisations"),
                    ("iaso_registry_write", "Editer le Registre"),
                    ("iaso_registry_read", "Lire le Registre"),
                    ("iaso_links", "Correspondances sources"),
                    ("iaso_users", "Users"),
                    ("iaso_users_managed", "Users managed"),
                    ("iaso_pages", "Pages"),
                    ("iaso_projects", "Projets"),
                    ("iaso_sources", "Sources"),
                    ("iaso_sources_can_change_default_version", "Can change the default version of a data source"),
                    ("iaso_data_tasks", "Tâches"),
                    ("iaso_submissions", "Soumissions"),
                    ("iaso_update_submission", "Editer soumissions"),
                    ("iaso_planning_write", "Editer le planning"),
                    ("iaso_planning_read", "Lire le planning"),
                    ("iaso_reports", "Reports"),
                    ("iaso_teams", "Equipes"),
                    ("iaso_assignments", "Attributions"),
                    ("iaso_entities", "Entities"),
                    ("iaso_entity_type_write", "Write entity type"),
                    ("iaso_storages", "Storages"),
                    ("iaso_completeness_stats", "Completeness stats"),
                    ("iaso_workflows", "Workflows"),
                    ("iaso_entity_duplicates_read", "Read Entity duplicates"),
                    ("iaso_entity_duplicates_write", "Write Entity duplicates"),
                    ("iaso_user_roles", "Manage user roles"),
                    ("iaso_datastore_read", "Read data store"),
                    ("iaso_datastore_write", "Write data store"),
                    ("iaso_org_unit_types", "Org unit types"),
                    ("iaso_org_unit_groups", "Org unit groups"),
                    ("iaso_org_unit_change_request_review", "Org unit change request review"),
                    ("iaso_org_unit_change_request_configurations", "Org unit change request configurations"),
                    ("iaso_write_sources", "Write data source"),
                    ("iaso_page_write", "Write page"),
                    ("iaso_payments", "Payments page"),
                    ("iaso_mobile_app_offline_setup", "Mobile app offline setup"),
                ),
                "managed": False,
                "default_permissions": [],
            },
        ),
        migrations.CreateModel(
            name="Account",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.TextField(unique=True, validators=[django.core.validators.MinLengthValidator(1)])),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user_manual_path", models.TextField(blank=True, null=True)),
                (
                    "modules",
                    iaso.models.base.ChoiceArrayField(
                        base_field=models.CharField(
                            choices=[
                                ("DATA_COLLECTION_FORMS", "Data collection - Forms"),
                                ("DEFAULT", "Default"),
                                ("DHIS2_MAPPING", "DHIS2 mapping"),
                                ("EMBEDDED_LINKS", "Embedded links"),
                                ("ENTITIES", "Entities"),
                                ("EXTERNAL_STORAGE", "External storage"),
                                ("PLANNING", "Planning"),
                                ("POLIO_PROJECT", "Polio project"),
                                ("REGISTRY", "Registry"),
                                ("PAYMENTS", "Payments"),
                                ("COMPLETENESS_PER_PERIOD", "Completeness per Period"),
                                ("TRYPELIM_PROJECT", "Trypelim project"),
                                ("DATA_VALIDATION", "Data validation"),
                            ],
                            max_length=100,
                        ),
                        blank=True,
                        default=list,
                        null=True,
                        size=None,
                    ),
                ),
                ("analytics_script", models.TextField(blank=True, null=True)),
                ("custom_translations", models.JSONField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name="AccountFeatureFlag",
            fields=[
                ("name", models.CharField(max_length=255)),
                ("code", models.CharField(max_length=255, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="AlgorithmRun",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("ended_at", models.DateTimeField(blank=True, null=True)),
                ("result", models.JSONField(blank=True, null=True)),
                ("finished", models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name="DataSource",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255, unique=True)),
                ("read_only", models.BooleanField(default=False)),
                ("description", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "tree_config_status_fields",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(blank=True, choices=[], max_length=30),
                        blank=True,
                        default=list,
                        help_text="List of statuses used for display configuration of the OrgUnit tree.",
                        size=None,
                    ),
                ),
                ("public", models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name="DataSourceVersionsSynchronization",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "name",
                    models.CharField(
                        help_text="Used in the UI e.g. to filter Change Requests by Data Source Synchronization operations.",
                        max_length=255,
                    ),
                ),
                (
                    "json_diff",
                    models.JSONField(blank=True, help_text="The diff used to create change requests.", null=True),
                ),
                (
                    "diff_config",
                    models.TextField(
                        blank=True, help_text="A string representation of the parameters used for the diff."
                    ),
                ),
                (
                    "count_create",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="The number of change requests that will be generated to create an org unit.",
                    ),
                ),
                (
                    "count_update",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="The number of change requests that will be generated to update an org unit.",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("account", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.account")),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_data_source_synchronizations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Data source synchronization",
            },
        ),
        migrations.CreateModel(
            name="Device",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("imei", models.CharField(blank=True, max_length=250, null=True)),
                ("test_device", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="Entity",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("name", models.CharField(blank=True, max_length=255)),
                ("uuid", models.UUIDField(default=uuid.uuid4, editable=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("account", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="iaso.account")),
            ],
            options={
                "verbose_name_plural": "Entities",
            },
        ),
        migrations.CreateModel(
            name="EntityType",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("code", models.CharField(blank=True, max_length=255, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_active", models.BooleanField(default=False)),
                (
                    "fields_list_view",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(blank=True, db_collation="case_insensitive", max_length=255),
                        blank=True,
                        null=True,
                        size=100,
                    ),
                ),
                (
                    "fields_detail_info_view",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(blank=True, db_collation="case_insensitive", max_length=255),
                        blank=True,
                        null=True,
                        size=100,
                    ),
                ),
                (
                    "fields_duplicate_search",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(blank=True, db_collation="case_insensitive", max_length=255),
                        blank=True,
                        null=True,
                        size=100,
                    ),
                ),
                ("prevent_add_if_duplicate_found", models.BooleanField(default=False)),
                (
                    "account",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="iaso.account"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ExportLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("sent", models.JSONField(blank=True, null=True)),
                ("received", models.JSONField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("http_status", models.IntegerField(blank=True, null=True)),
                ("url", models.TextField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name="ExportRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("params", models.JSONField(blank=True, null=True)),
                ("result", models.JSONField(blank=True, null=True)),
                ("finished", models.BooleanField(default=False)),
                (
                    "status",
                    models.TextField(
                        choices=[
                            ("QUEUED", "Queued"),
                            ("RUNNING", "Running"),
                            ("EXPORTED", "Exported"),
                            ("ERRORED", "Errored"),
                            ("SKIPPED", "Skipped"),
                            ("KILLED", "Killed"),
                            ("SUCCESS", "Success"),
                        ],
                        default="QUEUED",
                    ),
                ),
                ("instance_count", models.IntegerField()),
                ("exported_count", models.IntegerField()),
                ("errored_count", models.IntegerField()),
                ("last_error_message", models.TextField()),
                ("continue_on_error", models.BooleanField(default=False)),
                ("queued_at", models.DateTimeField(auto_now_add=True)),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("ended_at", models.DateTimeField(blank=True, null=True)),
                (
                    "launcher",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="FeatureFlag",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=100, unique=True)),
                ("name", models.CharField(max_length=100)),
                ("requires_authentication", models.BooleanField(default=False)),
                ("description", models.TextField(blank=True)),
                (
                    "category",
                    models.TextField(
                        choices=[
                            ("DCO", "Data collection options"),
                            ("REO", "Refresh options"),
                            ("GEO", "Geographic options"),
                            ("DAV", "Data Validation"),
                            ("ENT", "Entities"),
                            ("PLA", "Planning"),
                            ("SPO", "Specific options"),
                            ("NA", "Not specified"),
                        ],
                        default="NA",
                    ),
                ),
                ("configuration_schema", models.JSONField(blank=True, default=None, null=True)),
                ("order", models.PositiveSmallIntegerField(default=0)),
                ("is_dangerous", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="Form",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("form_id", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.TextField()),
                ("device_field", models.TextField(blank=True, null=True)),
                ("location_field", models.TextField(blank=True, null=True)),
                ("correlation_field", models.TextField(blank=True, null=True)),
                ("correlatable", models.BooleanField(default=False)),
                (
                    "possible_fields",
                    models.JSONField(
                        blank=True,
                        help_text="Questions present in all versions of the form, as a flat list.Automatically updated on new versions.",
                        null=True,
                    ),
                ),
                (
                    "period_type",
                    models.TextField(
                        blank=True,
                        choices=[
                            ("DAY", "Day"),
                            ("MONTH", "Month"),
                            ("QUARTER", "Quarter"),
                            ("QUARTER_NOV", "Quarter Nov"),
                            ("SIX_MONTH", "Six-month"),
                            ("YEAR", "Year"),
                            ("FINANCIAL_NOV", "Financial Nov"),
                        ],
                        null=True,
                    ),
                ),
                ("single_per_period", models.BooleanField(default=False)),
                ("periods_before_allowed", models.IntegerField(default=0, null=True)),
                ("periods_after_allowed", models.IntegerField(default=0, null=True)),
                ("derived", models.BooleanField(default=False)),
                ("uuid", models.UUIDField(default=uuid.uuid4, unique=True)),
                (
                    "label_keys",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(blank=True, db_collation="case_insensitive", max_length=255),
                        blank=True,
                        null=True,
                        size=100,
                    ),
                ),
                ("legend_threshold", models.JSONField(blank=True, null=True)),
                (
                    "change_request_mode",
                    models.TextField(
                        choices=[
                            ("CR_MODE_NONE", "No change request"),
                            ("CR_MODE_IF_REFERENCE_FORM", "Create change request if form is reference form"),
                        ],
                        default="CR_MODE_NONE",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="FormVersion",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("file", models.FileField(upload_to=iaso.models.forms.form_version_upload_to)),
                ("md5", models.CharField(blank=True, max_length=32)),
                (
                    "xls_file",
                    models.FileField(blank=True, null=True, upload_to=iaso.models.forms.form_version_upload_to),
                ),
                ("form_descriptor", models.JSONField(blank=True, null=True)),
                ("version_id", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("start_period", models.TextField(blank=True, null=True)),
                ("end_period", models.TextField(blank=True, null=True)),
                (
                    "possible_fields",
                    models.JSONField(
                        blank=True,
                        editable=False,
                        help_text="Questions present in this form version, as a flat list.Update on save. See equivalent on Form for all version",
                        null=True,
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="form_version_created_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "form",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="form_versions", to="iaso.form"
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="form_version_updated_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Group",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.TextField()),
                ("source_ref", models.TextField(blank=True, null=True)),
                ("block_of_countries", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="GroupSet",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.TextField()),
                ("source_ref", models.TextField(blank=True, null=True)),
                (
                    "group_belonging",
                    models.TextField(
                        choices=[("SINGLE", "Single"), ("MULTIPLE", "Multiple")], default="SINGLE", max_length=10
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("groups", models.ManyToManyField(blank=True, related_name="group_sets", to="iaso.group")),
            ],
        ),
        migrations.CreateModel(
            name="Instance",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "source_created_at",
                    models.DateTimeField(blank=True, help_text="Creation time on the device", null=True),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "source_updated_at",
                    models.DateTimeField(blank=True, help_text="Update time on the device", null=True),
                ),
                ("uuid", models.TextField(blank=True, null=True)),
                ("export_id", models.TextField(blank=True, default=iaso.utils.dhis2.generate_id_for_dhis_2, null=True)),
                ("correlation_id", models.BigIntegerField(blank=True, null=True)),
                ("name", models.TextField(blank=True, null=True)),
                ("file", models.FileField(blank=True, null=True, upload_to=iaso.models.instances.instance_upload_to)),
                ("file_name", models.TextField(blank=True, null=True)),
                ("location", django.contrib.gis.db.models.fields.PointField(blank=True, dim=3, null=True, srid=4326)),
                ("json", models.JSONField(blank=True, null=True)),
                ("accuracy", models.DecimalField(blank=True, decimal_places=2, max_digits=7, null=True)),
                ("period", models.TextField(blank=True, db_index=True, null=True)),
                ("last_export_success_at", models.DateTimeField(blank=True, null=True)),
                ("deleted", models.BooleanField(default=False)),
                ("to_export", models.BooleanField(default=False)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL
                    ),
                ),
                (
                    "device",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="iaso.device"
                    ),
                ),
                (
                    "entity",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="instances",
                        to="iaso.entity",
                    ),
                ),
                (
                    "form",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="instances",
                        to="iaso.form",
                    ),
                ),
                (
                    "form_version",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="form_version",
                        to="iaso.formversion",
                    ),
                ),
                (
                    "last_modified_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="last_modified_by",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="InstanceFile",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.TextField(blank=True, null=True)),
                (
                    "file",
                    models.FileField(blank=True, null=True, upload_to=iaso.models.instances.instance_file_upload_to),
                ),
                ("deleted", models.BooleanField(default=False)),
                (
                    "instance",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="iaso.instance"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Mapping",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.TextField()),
                (
                    "mapping_type",
                    models.TextField(
                        choices=[
                            ("AGGREGATE", "Aggregate"),
                            ("EVENT", "Event"),
                            ("EVENT_TRACKER", "Event Tracker"),
                            ("DERIVED", "Derived"),
                        ]
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "data_source",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="mappings", to="iaso.datasource"
                    ),
                ),
                (
                    "form",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="iaso.form"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="MetricType",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("code", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("source", models.CharField(blank=True, max_length=255)),
                ("units", models.CharField(blank=True, max_length=255)),
                ("unit_symbol", models.CharField(blank=True, max_length=255)),
                ("category", models.CharField(blank=True, max_length=255)),
                ("comments", models.TextField(blank=True)),
                (
                    "legend_type",
                    models.CharField(
                        choices=[("threshold", "Threshold"), ("linear", "Linear"), ("ordinal", "Ordinal")],
                        default="threshold",
                        max_length=40,
                    ),
                ),
                ("legend_config", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("account", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.account")),
            ],
            options={
                "ordering": ["id"],
            },
        ),
        migrations.CreateModel(
            name="OrgUnit",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("uuid", models.TextField(blank=True, db_index=True, null=True)),
                ("custom", models.BooleanField(default=False)),
                ("validated", models.BooleanField(db_index=True, default=True)),
                (
                    "validation_status",
                    models.CharField(
                        choices=[("NEW", "new"), ("VALID", "valid"), ("REJECTED", "rejected")],
                        default="NEW",
                        max_length=25,
                    ),
                ),
                ("path", django_ltree.fields.PathField(blank=True, null=True, unique=True)),
                (
                    "aliases",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(blank=True, db_collation="case_insensitive", max_length=255),
                        blank=True,
                        null=True,
                        size=100,
                    ),
                ),
                ("sub_source", models.TextField(blank=True, null=True)),
                ("source_ref", models.TextField(blank=True, db_index=True, null=True)),
                (
                    "geom",
                    django.contrib.gis.db.models.fields.MultiPolygonField(
                        blank=True, geography=True, null=True, srid=4326
                    ),
                ),
                (
                    "simplified_geom",
                    django.contrib.gis.db.models.fields.MultiPolygonField(
                        blank=True, geography=True, null=True, srid=4326
                    ),
                ),
                (
                    "catchment",
                    django.contrib.gis.db.models.fields.MultiPolygonField(
                        blank=True, geography=True, null=True, srid=4326
                    ),
                ),
                ("geom_ref", models.IntegerField(blank=True, null=True)),
                ("gps_source", models.TextField(blank=True, null=True)),
                (
                    "location",
                    django.contrib.gis.db.models.fields.PointField(
                        blank=True, dim=3, geography=True, null=True, srid=4326
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "source_created_at",
                    models.DateTimeField(blank=True, help_text="Creation time on the client device", null=True),
                ),
                ("extra_fields", models.JSONField(blank=True, default=dict)),
                ("opening_date", models.DateField(blank=True, null=True)),
                ("closed_date", models.DateField(blank=True, null=True)),
                ("code", models.TextField(blank=True, db_index=True)),
                (
                    "creator",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL
                    ),
                ),
                (
                    "default_image",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="default_for_org_units",
                        to="iaso.instancefile",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="OrgUnitType",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("short_name", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "category",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("COUNTRY", "Country"),
                            ("REGION", "Region"),
                            ("DISTRICT", "District"),
                            ("HF", "Health Facility"),
                        ],
                        max_length=8,
                        null=True,
                    ),
                ),
                ("depth", models.PositiveSmallIntegerField(blank=True, null=True)),
                (
                    "allow_creating_sub_unit_types",
                    models.ManyToManyField(blank=True, related_name="create_types", to="iaso.orgunittype"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="PaymentLot",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("comment", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("new", "New"),
                            ("sent", "Sent"),
                            ("paid", "Paid"),
                            ("partially_paid", "Partially Paid"),
                        ],
                        default="new",
                        max_length=40,
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payment_lot_created_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Project",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.TextField()),
                ("app_id", models.TextField(blank=True, null=True, unique=True)),
                ("needs_authentication", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("external_token", models.UUIDField(default=uuid.uuid4, null=True)),
                ("min_version", models.IntegerField(null=True)),
                ("redirection_url", models.URLField(blank=True, null=True)),
                ("color", models.CharField(blank=True, default="#1976D2", max_length=7, null=True)),
                (
                    "account",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="iaso.account"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="StorageDevice",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("customer_chosen_id", models.CharField(max_length=255)),
                ("type", models.CharField(choices=[("NFC", "NFC"), ("USB", "USB"), ("SD", "SD")], max_length=8)),
                (
                    "status",
                    models.CharField(
                        choices=[("OK", "OK"), ("BLACKLISTED", "BLACKLISTED")], default="OK", max_length=64
                    ),
                ),
                (
                    "status_reason",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("STOLEN", "STOLEN"),
                            ("LOST", "LOST"),
                            ("DAMAGED", "DAMAGED"),
                            ("ABUSE", "ABUSE"),
                            ("OTHER", "OTHER"),
                        ],
                        max_length=64,
                    ),
                ),
                ("status_comment", models.TextField(blank=True)),
                ("status_updated_at", models.DateTimeField(auto_now_add=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("account", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="iaso.account")),
                (
                    "entity",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="iaso.entity"
                    ),
                ),
                (
                    "org_unit",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="iaso.orgunit"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Workflow",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("uuid", models.UUIDField(default=uuid.uuid4, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "entity_type",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE, related_name="workflow", to="iaso.entitytype"
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="WorkflowVersion",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("uuid", models.UUIDField(default=uuid.uuid4, unique=True)),
                ("name", models.CharField(default="No Name", max_length=50)),
                (
                    "status",
                    models.CharField(
                        choices=[("DRAFT", "Draft"), ("UNPUBLISHED", "Unpublished"), ("PUBLISHED", "Published")],
                        default="DRAFT",
                        max_length=12,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "workflow",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workflow_versions",
                        to="iaso.workflow",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="WorkflowFollowup",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("order", models.IntegerField(default=0)),
                ("condition", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("forms", models.ManyToManyField(to="iaso.form")),
                (
                    "workflow_version",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="follow_ups",
                        to="iaso.workflowversion",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="WorkflowChange",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("mapping", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("form", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.form")),
                (
                    "workflow_version",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="changes", to="iaso.workflowversion"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="UserRole",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("account", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.account")),
                (
                    "editable_org_unit_types",
                    models.ManyToManyField(blank=True, related_name="editable_by_user_role_set", to="iaso.orgunittype"),
                ),
                (
                    "group",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE, related_name="iaso_user_role", to="auth.group"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Team",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("name", models.CharField(max_length=100)),
                ("description", models.TextField(blank=True)),
                ("path", django_ltree.fields.PathField(unique=True)),
                (
                    "type",
                    models.CharField(
                        blank=True,
                        choices=[("TEAM_OF_TEAMS", "Team of teams"), ("TEAM_OF_USERS", "Team of users")],
                        max_length=100,
                        null=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL
                    ),
                ),
                (
                    "manager",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="managed_teams",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "parent",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="sub_teams",
                        to="iaso.team",
                    ),
                ),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="iaso.project")),
                ("users", models.ManyToManyField(blank=True, related_name="teams", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ("name",),
            },
        ),
        migrations.CreateModel(
            name="Task",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("ended_at", models.DateTimeField(blank=True, null=True)),
                ("progress_value", models.IntegerField(default=0)),
                ("end_value", models.IntegerField(default=0)),
                ("result", models.JSONField(blank=True, null=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("QUEUED", "Queued"),
                            ("RUNNING", "Running"),
                            ("EXPORTED", "Exported"),
                            ("ERRORED", "Errored"),
                            ("SKIPPED", "Skipped"),
                            ("KILLED", "Killed"),
                            ("SUCCESS", "Success"),
                        ],
                        default="QUEUED",
                        max_length=40,
                    ),
                ),
                ("name", models.TextField()),
                ("params", models.JSONField(blank=True, null=True)),
                ("queue_answer", models.JSONField(blank=True, null=True)),
                ("progress_message", models.TextField(blank=True, null=True)),
                ("should_be_killed", models.BooleanField(default=False)),
                ("external", models.BooleanField(default=False)),
                ("account", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.account")),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_tasks",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "launcher",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="StoragePassword",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("password", models.CharField(max_length=100)),
                ("is_compromised", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="storage_passwords", to="iaso.project"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="StorageLogEntry",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                (
                    "operation_type",
                    models.CharField(
                        choices=[
                            ("WRITE_PROFILE", "WRITE_PROFILE"),
                            ("RESET", "RESET"),
                            ("READ", "READ"),
                            ("WRITE_RECORD", "WRITE_RECORD"),
                            ("CHANGE_STATUS", "CHANGE_STATUS"),
                        ],
                        max_length=32,
                    ),
                ),
                ("performed_at", models.DateTimeField()),
                (
                    "status",
                    models.CharField(blank=True, choices=[("OK", "OK"), ("BLACKLISTED", "BLACKLISTED")], max_length=64),
                ),
                (
                    "status_reason",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("STOLEN", "STOLEN"),
                            ("LOST", "LOST"),
                            ("DAMAGED", "DAMAGED"),
                            ("ABUSE", "ABUSE"),
                            ("OTHER", "OTHER"),
                        ],
                        max_length=64,
                    ),
                ),
                ("status_comment", models.TextField(blank=True)),
                (
                    "device",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="log_entries", to="iaso.storagedevice"
                    ),
                ),
                (
                    "entity",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="iaso.entity"
                    ),
                ),
                (
                    "instances",
                    models.ManyToManyField(blank=True, related_name="storage_log_entries", to="iaso.instance"),
                ),
                (
                    "org_unit",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="iaso.orgunit"
                    ),
                ),
                (
                    "performed_by",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={
                "verbose_name_plural": "storage log entries",
                "ordering": ["-performed_at"],
            },
        ),
        migrations.CreateModel(
            name="SourceVersion",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("number", models.IntegerField()),
                ("description", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "data_source",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="versions", to="iaso.datasource"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ReportVersion",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("file", models.FileField(upload_to=iaso.models.reports.report_version_upload_to)),
                ("name", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "status",
                    models.CharField(
                        choices=[("published", "Published"), ("unpublished", "Unpublished")],
                        default="unpublished",
                        max_length=255,
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="report_version_created_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="report_version_updated_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="Report",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("name", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="iaso.project")),
                (
                    "published_version",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="iaso.reportversion"),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="RecordType",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.TextField()),
                ("description", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("projects", models.ManyToManyField(blank=True, related_name="record_types", to="iaso.project")),
            ],
        ),
        migrations.CreateModel(
            name="Record",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("value", models.DecimalField(decimal_places=10, max_digits=19)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "org_unit",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.orgunit"
                    ),
                ),
                (
                    "record_type",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.recordtype"
                    ),
                ),
                (
                    "version",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.sourceversion"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ProjectFeatureFlags",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("configuration", models.JSONField(default=None, null=True)),
                ("featureflag", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.featureflag")),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.project")),
            ],
            options={
                "db_table": "iaso_project_feature_flags",
            },
        ),
        migrations.AddField(
            model_name="project",
            name="feature_flags",
            field=models.ManyToManyField(
                blank=True, related_name="+", through="iaso.ProjectFeatureFlags", to="iaso.featureflag"
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="forms",
            field=models.ManyToManyField(blank=True, related_name="projects", to="iaso.form"),
        ),
        migrations.CreateModel(
            name="Profile",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("external_user_id", models.CharField(blank=True, max_length=512, null=True)),
                ("organization", models.CharField(blank=True, max_length=512, null=True)),
                ("language", models.CharField(blank=True, max_length=512, null=True)),
                (
                    "dhis2_id",
                    models.CharField(blank=True, help_text="Dhis2 user ID for SSO Auth", max_length=128, null=True),
                ),
                ("home_page", models.CharField(blank=True, max_length=512, null=True)),
                (
                    "phone_number",
                    phonenumber_field.modelfields.PhoneNumberField(blank=True, max_length=128, region=None),
                ),
                ("account", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.account")),
                (
                    "editable_org_unit_types",
                    models.ManyToManyField(
                        blank=True, related_name="editable_by_iaso_profile_set", to="iaso.orgunittype"
                    ),
                ),
                ("org_units", models.ManyToManyField(blank=True, related_name="iaso_profile", to="iaso.orgunit")),
                ("projects", models.ManyToManyField(blank=True, related_name="iaso_profile", to="iaso.project")),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="iaso_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                ("user_roles", models.ManyToManyField(blank=True, related_name="iaso_profile", to="iaso.userrole")),
            ],
        ),
        migrations.CreateModel(
            name="PotentialPayment",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "payment_lot",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="potential_payments",
                        to="iaso.paymentlot",
                    ),
                ),
                (
                    "task",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="potential_payments",
                        to="iaso.task",
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="potential_payment",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Planning",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("name", models.CharField(max_length=100)),
                ("description", models.TextField(blank=True)),
                ("started_at", models.DateField(blank=True, null=True)),
                ("ended_at", models.DateField(blank=True, null=True)),
                ("published_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL
                    ),
                ),
                ("forms", models.ManyToManyField(related_name="plannings", to="iaso.form")),
                ("org_unit", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="iaso.orgunit")),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="iaso.project")),
                ("team", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.team")),
            ],
            options={
                "ordering": ("name",),
            },
        ),
        migrations.AddField(
            model_name="paymentlot",
            name="task",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="payment_lots",
                to="iaso.task",
            ),
        ),
        migrations.AddField(
            model_name="paymentlot",
            name="updated_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="payment_lot_updated_set",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.CreateModel(
            name="Payment",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("sent", "Sent"), ("rejected", "Rejected"), ("paid", "Paid")],
                        default="pending",
                        max_length=40,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="payment_created_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "payment_lot",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="payments",
                        to="iaso.paymentlot",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="payment_updated_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="payment", to=settings.AUTH_USER_MODEL
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Page",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.TextField()),
                ("content", models.TextField(blank=True, null=True)),
                ("needs_authentication", models.BooleanField(default=True)),
                ("slug", models.SlugField(max_length=1000, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("RAW", "Raw html"),
                            ("TEXT", "Text"),
                            ("IFRAME", "Iframe"),
                            ("POWERBI", "PowerBI report"),
                            ("SUPERSET", "Superset dashboard"),
                        ],
                        default="RAW",
                        max_length=40,
                    ),
                ),
                ("powerbi_group_id", models.TextField(blank=True, null=True)),
                ("powerbi_report_id", models.TextField(blank=True, null=True)),
                ("powerbi_dataset_id", models.TextField(blank=True, null=True)),
                ("powerbi_filters", models.JSONField(blank=True, null=True)),
                (
                    "powerbi_language",
                    models.CharField(
                        blank=True,
                        help_text="Language and locale for the PowerBI embedded report e.g en-us or fr-be",
                        max_length=20,
                        null=True,
                    ),
                ),
                ("superset_dashboard_id", models.TextField(blank=True, null=True)),
                ("superset_dashboard_ui_config", models.JSONField(blank=True, null=True)),
                (
                    "account",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="iaso.account"
                    ),
                ),
                ("users", models.ManyToManyField(blank=True, related_name="pages", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name="orgunittype",
            name="projects",
            field=models.ManyToManyField(related_name="unit_types", to="iaso.project"),
        ),
        migrations.AddField(
            model_name="orgunittype",
            name="reference_forms",
            field=models.ManyToManyField(blank=True, related_name="reference_of_org_unit_types", to="iaso.form"),
        ),
        migrations.AddField(
            model_name="orgunittype",
            name="sub_unit_types",
            field=models.ManyToManyField(blank=True, related_name="super_types", to="iaso.orgunittype"),
        ),
        migrations.CreateModel(
            name="OrgUnitReferenceInstance",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("form", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.form")),
                ("instance", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.instance")),
                ("org_unit", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.orgunit")),
            ],
        ),
        migrations.CreateModel(
            name="OrgUnitChangeRequestConfiguration",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("org_units_editable", models.BooleanField(default=True)),
                ("type", models.CharField(choices=[("creation", "Creation"), ("edition", "Edition")], max_length=10)),
                (
                    "editable_fields",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(blank=True, max_length=30),
                        blank=True,
                        default=list,
                        help_text="List of fields that can be edited in an OrgUnit",
                        size=None,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="org_unit_change_request_configurations_created_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "editable_reference_forms",
                    models.ManyToManyField(
                        blank=True, related_name="org_unit_change_request_configurations", to="iaso.form"
                    ),
                ),
                (
                    "group_sets",
                    models.ManyToManyField(
                        blank=True, related_name="org_unit_change_request_configurations", to="iaso.groupset"
                    ),
                ),
                (
                    "org_unit_type",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="iaso.orgunittype"),
                ),
                (
                    "other_groups",
                    models.ManyToManyField(
                        blank=True, related_name="org_unit_change_request_configurations", to="iaso.group"
                    ),
                ),
                (
                    "possible_parent_types",
                    models.ManyToManyField(
                        blank=True,
                        related_name="org_unit_change_request_configurations_parent_level",
                        to="iaso.orgunittype",
                    ),
                ),
                (
                    "possible_types",
                    models.ManyToManyField(
                        blank=True,
                        related_name="org_unit_change_request_configurations_same_level",
                        to="iaso.orgunittype",
                    ),
                ),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.project")),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="org_unit_change_request_configurations_updated_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Org unit change request configuration",
            },
        ),
        migrations.CreateModel(
            name="OrgUnitChangeRequest",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("uuid", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                (
                    "status",
                    models.CharField(
                        choices=[("new", "New"), ("rejected", "Rejected"), ("approved", "Approved")],
                        default="new",
                        max_length=40,
                    ),
                ),
                (
                    "kind",
                    models.CharField(
                        choices=[("org_unit_creation", "Org Unit Creation"), ("org_unit_change", "Org Unit Change")],
                        default="org_unit_change",
                        max_length=40,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("rejection_comment", models.TextField(blank=True)),
                ("new_name", models.CharField(blank=True, max_length=255)),
                (
                    "new_location",
                    django.contrib.gis.db.models.fields.PointField(
                        blank=True, dim=3, geography=True, null=True, srid=4326
                    ),
                ),
                ("new_location_accuracy", models.DecimalField(blank=True, decimal_places=2, max_digits=7, null=True)),
                ("new_opening_date", models.DateField(blank=True, null=True)),
                ("new_closed_date", models.DateField(blank=True, null=True)),
                (
                    "requested_fields",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(blank=True, max_length=30),
                        blank=True,
                        default=list,
                        help_text="List of fields names for which a change is requested.",
                        size=None,
                    ),
                ),
                (
                    "approved_fields",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(blank=True, max_length=30),
                        blank=True,
                        default=list,
                        help_text="List of approved fields names (only a subset can be approved).",
                        size=None,
                    ),
                ),
                ("old_name", models.CharField(blank=True, max_length=255)),
                (
                    "old_location",
                    django.contrib.gis.db.models.fields.PointField(
                        blank=True, dim=3, geography=True, null=True, srid=4326
                    ),
                ),
                ("old_opening_date", models.DateField(blank=True, null=True)),
                ("old_closed_date", models.DateField(blank=True, null=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="org_unit_change_created_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "data_source_synchronization",
                    models.ForeignKey(
                        blank=True,
                        help_text="The data source synchronization that generated this change request.",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="change_requests",
                        to="iaso.datasourceversionssynchronization",
                    ),
                ),
                ("new_groups", models.ManyToManyField(blank=True, to="iaso.group")),
                (
                    "new_org_unit_type",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.orgunittype"
                    ),
                ),
                (
                    "new_parent",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="org_unit_change_parents_set",
                        to="iaso.orgunit",
                    ),
                ),
                ("new_reference_instances", models.ManyToManyField(blank=True, to="iaso.instance")),
                ("old_groups", models.ManyToManyField(blank=True, related_name="+", to="iaso.group")),
                (
                    "old_org_unit_type",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to="iaso.orgunittype",
                    ),
                ),
                (
                    "old_parent",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to="iaso.orgunit",
                    ),
                ),
                ("old_reference_instances", models.ManyToManyField(blank=True, related_name="+", to="iaso.instance")),
                ("org_unit", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.orgunit")),
                (
                    "payment",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="change_requests",
                        to="iaso.payment",
                    ),
                ),
                (
                    "potential_payment",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="change_requests",
                        to="iaso.potentialpayment",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="org_unit_change_updated_set",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Org unit change request",
            },
        ),
        migrations.AddField(
            model_name="orgunit",
            name="org_unit_type",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="org_units",
                to="iaso.orgunittype",
            ),
        ),
        migrations.AddField(
            model_name="orgunit",
            name="parent",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.orgunit"
            ),
        ),
        migrations.AddField(
            model_name="orgunit",
            name="reference_instances",
            field=models.ManyToManyField(blank=True, through="iaso.OrgUnitReferenceInstance", to="iaso.instance"),
        ),
        migrations.AddField(
            model_name="orgunit",
            name="version",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.sourceversion"
            ),
        ),
        migrations.CreateModel(
            name="MetricValue",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("year", models.IntegerField(blank=True, null=True)),
                ("value", models.FloatField(blank=True, null=True)),
                ("string_value", models.TextField(blank=True, default="")),
                ("metric_type", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="iaso.metrictype")),
                (
                    "org_unit",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="iaso.orgunit"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="MatchingAlgorithm",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.TextField()),
                ("description", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("projects", models.ManyToManyField(blank=True, related_name="match_algos", to="iaso.project")),
            ],
        ),
        migrations.CreateModel(
            name="MappingVersion",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.TextField()),
                ("json", models.JSONField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "form_version",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="mapping_versions",
                        to="iaso.formversion",
                    ),
                ),
                (
                    "mapping",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="versions",
                        to="iaso.mapping",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Link",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("validated", models.BooleanField(default=False)),
                ("validation_date", models.DateTimeField(auto_now=True, null=True)),
                ("similarity_score", models.SmallIntegerField(null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "algorithm_run",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.algorithmrun"
                    ),
                ),
                (
                    "destination",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="source_set",
                        to="iaso.orgunit",
                    ),
                ),
                (
                    "source",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="destination_set",
                        to="iaso.orgunit",
                    ),
                ),
                (
                    "validator",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="JsonDataStore",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField()),
                ("content", models.JSONField()),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("account", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="iaso.account")),
                (
                    "org_unit",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="iaso.orgunit"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="InstanceLock",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("locked_at", models.DateTimeField(auto_now_add=True)),
                ("unlocked_at", models.DateTimeField(blank=True, null=True)),
                ("instance", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.instance")),
                (
                    "locked_by",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL),
                ),
                (
                    "top_org_unit",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT, related_name="instance_lock", to="iaso.orgunit"
                    ),
                ),
                (
                    "unlocked_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-locked_at"],
            },
        ),
        migrations.AddField(
            model_name="instance",
            name="org_unit",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="iaso.orgunit"
            ),
        ),
        migrations.AddField(
            model_name="instance",
            name="planning",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="instances",
                to="iaso.planning",
            ),
        ),
        migrations.AddField(
            model_name="instance",
            name="project",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="iaso.project"
            ),
        ),
        migrations.CreateModel(
            name="ImportGPKG",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("file", models.FileField(upload_to=iaso.models.import_gpkg.import_gpkg_upload_to)),
                ("version_number", models.IntegerField(blank=True, null=True)),
                ("description", models.CharField(blank=True, max_length=200, null=True)),
                ("default_valid", models.BooleanField(default=False)),
                ("data_source", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.datasource")),
            ],
        ),
        migrations.AddField(
            model_name="groupset",
            name="source_version",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.sourceversion"
            ),
        ),
        migrations.AddField(
            model_name="group",
            name="org_units",
            field=models.ManyToManyField(blank=True, related_name="groups", to="iaso.orgunit"),
        ),
        migrations.AddField(
            model_name="group",
            name="source_version",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.sourceversion"
            ),
        ),
        migrations.CreateModel(
            name="FormPredefinedFilter",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.TextField()),
                ("short_name", models.CharField(max_length=25)),
                ("json_logic", models.JSONField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "form",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="predefined_filters", to="iaso.form"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="FormAttachment",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.TextField()),
                ("file", models.FileField(upload_to=iaso.models.forms.form_attachment_upload_to)),
                ("file_last_scan", models.DateTimeField(blank=True, null=True)),
                (
                    "file_scan_status",
                    models.CharField(
                        choices=[
                            ("CLEAN", "Clean"),
                            ("PENDING", "Pending"),
                            ("INFECTED", "Infected"),
                            ("ERROR", "Error"),
                        ],
                        default="PENDING",
                        max_length=10,
                    ),
                ),
                ("md5", models.CharField(max_length=32)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "form",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="attachments", to="iaso.form"
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="form",
            name="org_unit_types",
            field=models.ManyToManyField(blank=True, to="iaso.orgunittype"),
        ),
        migrations.CreateModel(
            name="ExternalCredentials",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.TextField()),
                ("login", models.TextField()),
                ("password", models.TextField()),
                ("url", models.TextField()),
                (
                    "account",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="credentials", to="iaso.account"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ExportStatus",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "status",
                    models.TextField(
                        choices=[
                            ("QUEUED", "Queued"),
                            ("RUNNING", "Running"),
                            ("EXPORTED", "Exported"),
                            ("ERRORED", "Errored"),
                            ("SKIPPED", "Skipped"),
                            ("KILLED", "Killed"),
                            ("SUCCESS", "Success"),
                        ],
                        default="QUEUED",
                    ),
                ),
                ("last_error_message", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("export_logs", models.ManyToManyField(blank=True, to="iaso.exportlog")),
                (
                    "export_request",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.exportrequest"),
                ),
                ("instance", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.instance")),
                (
                    "mapping_version",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.mappingversion"),
                ),
            ],
        ),
        migrations.AddField(
            model_name="entitytype",
            name="reference_form",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="iaso.form"),
        ),
        migrations.CreateModel(
            name="EntityDuplicateAnalyzis",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "algorithm",
                    models.CharField(choices=[("levenshtein", "Levenshtein")], default="levenshtein", max_length=20),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("metadata", models.JSONField(default=dict)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                (
                    "task",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="entity_duplicate_analyzis",
                        to="iaso.task",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="EntityDuplicate",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "validation_status",
                    models.CharField(
                        choices=[("PENDING", "Pending"), ("VALIDATED", "Validated"), ("IGNORED", "Ignored")],
                        default="PENDING",
                        max_length=20,
                    ),
                ),
                (
                    "type_of_relation",
                    models.CharField(
                        choices=[("DUPLICATE", "Duplicate"), ("COUSIN", "Cousin"), ("PRODUCED", "Produced")],
                        default="DUPLICATE",
                        max_length=20,
                    ),
                ),
                ("similarity_score", models.SmallIntegerField(null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                (
                    "analyze",
                    models.ForeignKey(
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="duplicates",
                        to="iaso.entityduplicateanalyzis",
                    ),
                ),
                (
                    "entity1",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="duplicates1", to="iaso.entity"
                    ),
                ),
                (
                    "entity2",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="duplicates2", to="iaso.entity"
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="entity",
            name="attributes",
            field=models.OneToOneField(
                blank=True,
                help_text="instance",
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="attributes",
                to="iaso.instance",
            ),
        ),
        migrations.AddField(
            model_name="entity",
            name="entity_type",
            field=models.ForeignKey(blank=True, on_delete=django.db.models.deletion.PROTECT, to="iaso.entitytype"),
        ),
        migrations.AddField(
            model_name="entity",
            name="merged_to",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="iaso.entity"
            ),
        ),
        migrations.CreateModel(
            name="DevicePosition",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("uuid", models.UUIDField(default=uuid.uuid4, unique=True)),
                ("location", django.contrib.gis.db.models.fields.PointField(dim=3, srid=4326)),
                (
                    "transport",
                    models.CharField(choices=[("car", "Car"), ("foot", "Foot"), ("truck", "Truc")], max_length=32),
                ),
                ("accuracy", models.DecimalField(decimal_places=2, max_digits=7)),
                ("captured_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("device", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.device")),
            ],
        ),
        migrations.CreateModel(
            name="DeviceOwnership",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("start", models.DateTimeField(auto_now_add=True)),
                ("end", models.DateTimeField(null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("device", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.device")),
                (
                    "project",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="iaso.project"
                    ),
                ),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name="device",
            name="projects",
            field=models.ManyToManyField(blank=True, related_name="devices", to="iaso.project"),
        ),
        migrations.AddField(
            model_name="datasourceversionssynchronization",
            name="source_version_to_compare_with",
            field=models.ForeignKey(
                help_text="The version of the pyramid to use as a comparison.",
                on_delete=django.db.models.deletion.CASCADE,
                related_name="synchronized_as_source_version_to_compare_with",
                to="iaso.sourceversion",
            ),
        ),
        migrations.AddField(
            model_name="datasourceversionssynchronization",
            name="source_version_to_update",
            field=models.ForeignKey(
                help_text="The version of the pyramid for which we want to generate change requests.",
                on_delete=django.db.models.deletion.CASCADE,
                related_name="synchronized_as_source_version_to_update",
                to="iaso.sourceversion",
            ),
        ),
        migrations.AddField(
            model_name="datasourceversionssynchronization",
            name="sync_task",
            field=models.OneToOneField(
                blank=True,
                help_text="The background task that used the diff to create change requests.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to="iaso.task",
            ),
        ),
        migrations.AddField(
            model_name="datasource",
            name="credentials",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="data_sources",
                to="iaso.externalcredentials",
            ),
        ),
        migrations.AddField(
            model_name="datasource",
            name="default_version",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="iaso.sourceversion"
            ),
        ),
        migrations.AddField(
            model_name="datasource",
            name="projects",
            field=models.ManyToManyField(blank=True, related_name="data_sources", to="iaso.project"),
        ),
        migrations.CreateModel(
            name="Config",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField(unique=True)),
                ("content", models.JSONField()),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("users", models.ManyToManyField(blank=True, related_name="jsonconfigs", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="CommentIaso",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("object_pk", models.CharField(db_index=True, max_length=64, verbose_name="object ID")),
                ("user_name", models.CharField(blank=True, max_length=50, verbose_name="user's name")),
                ("user_email", models.EmailField(blank=True, max_length=254, verbose_name="user's email address")),
                ("user_url", models.URLField(blank=True, verbose_name="user's URL")),
                ("comment", models.TextField(max_length=3000, verbose_name="comment")),
                ("submit_date", models.DateTimeField(db_index=True, default=None, verbose_name="date/time submitted")),
                (
                    "ip_address",
                    models.GenericIPAddressField(blank=True, null=True, unpack_ipv4=True, verbose_name="IP address"),
                ),
                (
                    "is_public",
                    models.BooleanField(
                        default=True,
                        help_text="Uncheck this box to make the comment effectively disappear from the site.",
                        verbose_name="is public",
                    ),
                ),
                (
                    "is_removed",
                    models.BooleanField(
                        db_index=True,
                        default=False,
                        help_text='Check this box if the comment is inappropriate. A "This comment has been removed" message will be displayed instead.',
                        verbose_name="is removed",
                    ),
                ),
                (
                    "content_type",
                    models.ForeignKey(
                        limit_choices_to={"model": "orgunit"},
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="content_type_set_for_%(class)s2",
                        to="contenttypes.contenttype",
                        verbose_name="content type",
                    ),
                ),
                (
                    "parent",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="children",
                        to="iaso.commentiaso",
                    ),
                ),
                ("site", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="sites.site")),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_comments",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="user",
                    ),
                ),
            ],
            options={
                "verbose_name": "comment",
                "verbose_name_plural": "comments",
                "ordering": ("submit_date",),
                "permissions": [("can_moderate", "Can moderate comments")],
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="BulkCreateUserCsvFile",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "file",
                    models.FileField(
                        upload_to=iaso.models.bulk_create_user_csv_file.bulk_create_user_csv_file_upload_to
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "account",
                    models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to="iaso.account"),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True, on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Assignment",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="assignments_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "org_unit",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.orgunit"
                    ),
                ),
                (
                    "planning",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.planning"
                    ),
                ),
                (
                    "team",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="iaso.team"
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="assignments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ("planning", "created_at"),
            },
        ),
        migrations.AddField(
            model_name="algorithmrun",
            name="algorithm",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.matchingalgorithm"),
        ),
        migrations.AddField(
            model_name="algorithmrun",
            name="launcher",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AddField(
            model_name="algorithmrun",
            name="version_1",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="runs_where_destination",
                to="iaso.sourceversion",
            ),
        ),
        migrations.AddField(
            model_name="algorithmrun",
            name="version_2",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="runs_where_source",
                to="iaso.sourceversion",
            ),
        ),
        migrations.AddField(
            model_name="account",
            name="default_version",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="iaso.sourceversion"
            ),
        ),
        migrations.AddField(
            model_name="account",
            name="feature_flags",
            field=models.ManyToManyField(to="iaso.accountfeatureflag"),
        ),
        migrations.CreateModel(
            name="TenantUser",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "account_user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tenant_user",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "main_user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tenant_users",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["created_at"], name="iaso_tenant_created_003e12_idx"),
                    models.Index(fields=["updated_at"], name="iaso_tenant_updated_31049b_idx"),
                ],
            },
        ),
        migrations.AddConstraint(
            model_name="tenantuser",
            constraint=models.UniqueConstraint(fields=("main_user", "account_user"), name="main_user_user_constraint"),
        ),
        migrations.AddIndex(
            model_name="task",
            index=models.Index(fields=["created_at"], name="iaso_task_created_25fae0_idx"),
        ),
        migrations.AddIndex(
            model_name="task",
            index=models.Index(fields=["name"], name="iaso_task_name_5f0019_idx"),
        ),
        migrations.AddIndex(
            model_name="task",
            index=models.Index(fields=["status"], name="iaso_task_status_bb234e_idx"),
        ),
        migrations.AlterUniqueTogether(
            name="storagedevice",
            unique_together={("customer_chosen_id", "account", "type")},
        ),
        migrations.AddConstraint(
            model_name="sourceversion",
            constraint=models.UniqueConstraint(
                fields=("data_source", "number"), name="unique_number_data_source_version"
            ),
        ),
        migrations.AddConstraint(
            model_name="profile",
            constraint=models.UniqueConstraint(fields=("dhis2_id", "account"), name="dhis2_id_constraint"),
        ),
        migrations.AlterUniqueTogether(
            name="orgunitreferenceinstance",
            unique_together={("org_unit", "form")},
        ),
        migrations.AddIndex(
            model_name="orgunitchangerequestconfiguration",
            index=models.Index(fields=["project"], name="iaso_orguni_project_6d2cbe_idx"),
        ),
        migrations.AddIndex(
            model_name="orgunitchangerequestconfiguration",
            index=models.Index(fields=["org_unit_type"], name="iaso_orguni_org_uni_a6fdd1_idx"),
        ),
        migrations.AddIndex(
            model_name="orgunitchangerequestconfiguration",
            index=models.Index(fields=["type"], name="iaso_orguni_type_c2bf6e_idx"),
        ),
        migrations.AddConstraint(
            model_name="orgunitchangerequestconfiguration",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("project", "org_unit_type", "type"),
                name="unique_project_org_unit_type_if_not_deleted",
            ),
        ),
        migrations.AddIndex(
            model_name="orgunitchangerequest",
            index=models.Index(fields=["created_at"], name="iaso_orguni_created_c06ca8_idx"),
        ),
        migrations.AddIndex(
            model_name="orgunitchangerequest",
            index=models.Index(fields=["updated_at"], name="iaso_orguni_updated_205eb3_idx"),
        ),
        migrations.AddIndex(
            model_name="orgunit",
            index=django.contrib.postgres.indexes.GistIndex(
                buffering=True, fields=["path"], name="iaso_orguni_path_d11c66_gist"
            ),
        ),
        migrations.AddIndex(
            model_name="orgunit",
            index=django.contrib.postgres.indexes.GinIndex(
                fields=["extra_fields"], name="iaso_orguni_extra_f_a15e77_gin"
            ),
        ),
        migrations.AddIndex(
            model_name="orgunit",
            index=models.Index(fields=["created_at"], name="iaso_orguni_created_51218f_idx"),
        ),
        migrations.AddIndex(
            model_name="orgunit",
            index=models.Index(fields=["updated_at"], name="iaso_orguni_updated_8eca3a_idx"),
        ),
        migrations.AddIndex(
            model_name="orgunit",
            index=models.Index(fields=["source_created_at"], name="iaso_orguni_source__c29c2f_idx"),
        ),
        migrations.AddIndex(
            model_name="orgunit",
            index=models.Index(fields=["org_unit_type", "version"], name="iaso_orguni_org_uni_28a2c8_idx"),
        ),
        migrations.AddConstraint(
            model_name="orgunit",
            constraint=models.UniqueConstraint(
                condition=models.Q(models.Q(("code", ""), _negated=True), models.Q(("validation_status", "VALID"))),
                fields=("code", "version"),
                name="unique_code_per_source_version_if_not_blank_and_valid_status",
            ),
        ),
        migrations.AlterUniqueTogether(
            name="metricvalue",
            unique_together={("metric_type", "org_unit", "year")},
        ),
        migrations.AlterUniqueTogether(
            name="metrictype",
            unique_together={("account", "code")},
        ),
        migrations.AlterUniqueTogether(
            name="mappingversion",
            unique_together={("form_version", "name")},
        ),
        migrations.AlterUniqueTogether(
            name="jsondatastore",
            unique_together={("slug", "account", "org_unit")},
        ),
        migrations.AddIndex(
            model_name="instance",
            index=models.Index(fields=["created_at"], name="iaso_instan_created_04174a_idx"),
        ),
        migrations.AddIndex(
            model_name="instance",
            index=models.Index(fields=["updated_at"], name="iaso_instan_updated_1d2d65_idx"),
        ),
        migrations.AddIndex(
            model_name="instance",
            index=models.Index(fields=["source_created_at"], name="iaso_instan_source__8a77f6_idx"),
        ),
        migrations.AddIndex(
            model_name="instance",
            index=models.Index(fields=["source_updated_at"], name="iaso_instan_source__da894d_idx"),
        ),
        migrations.AlterUniqueTogether(
            name="formattachment",
            unique_together={("form", "name")},
        ),
        migrations.AlterUniqueTogether(
            name="entitytype",
            unique_together={("name", "account")},
        ),
        migrations.AlterUniqueTogether(
            name="entityduplicate",
            unique_together={("entity1", "entity2")},
        ),
        migrations.AlterUniqueTogether(
            name="assignment",
            unique_together={("planning", "org_unit")},
        ),
        migrations.RunSQL(
            sql="\nCREATE OR REPLACE FUNCTION iaso_group_org_units_same_source_version() RETURNS trigger AS\n$F$\nBEGIN\n    IF ((select count(*) from iaso_group_org_units go\n            join iaso_group on (iaso_group.id = go.group_id)\n            join iaso_orgunit on (iaso_orgunit.id = go.orgunit_id)\n            where go.group_id = new.group_id\n            and go.orgunit_id = new.orgunit_id\n            and iaso_orgunit.version_id != iaso_group.source_version_id) > 0)\n    THEN\n        RAISE EXCEPTION 'Constraint violation iaso_group_org_units_same_source_version_constraint';\n    END IF;\n    RETURN NEW;\nEND;\n$F$ LANGUAGE plpgsql;",
            reverse_sql="DROP FUNCTION iaso_group_org_units_same_source_version;",
        ),
        migrations.RunSQL(
            sql="\n        CREATE CONSTRAINT TRIGGER iaso_group_org_units_same_source_version_constraint\n        AFTER INSERT OR UPDATE\n        ON iaso_group_org_units\n        DEFERRABLE INITIALLY DEFERRED\n        FOR EACH ROW\n        EXECUTE PROCEDURE iaso_group_org_units_same_source_version();\n        ",
            reverse_sql="\n        DROP TRIGGER iaso_group_org_units_same_source_version_constraint\n        ON iaso_group_org_units;",
        ),
        migrations.RunSQL(
            sql="\n    CREATE OR REPLACE FUNCTION iaso_group_org_units_same_source_version_group() RETURNS trigger AS\n    $F$\n    BEGIN\n        IF ((select count(*) from iaso_group_org_units go\n                join iaso_group on (iaso_group.id = go.group_id)\n                join iaso_orgunit on (iaso_orgunit.id = go.orgunit_id)\n                where go.group_id = new.id\n\n                and iaso_orgunit.version_id != iaso_group.source_version_id) > 0)\n        THEN\n            RAISE EXCEPTION 'Constraint violation iaso_group_org_units_same_source_version_constraint';\n        END IF;\n        RETURN NEW;\n    END;\n    $F$ LANGUAGE plpgsql;",
            reverse_sql="DROP FUNCTION iaso_group_org_units_same_source_version;",
        ),
        migrations.RunSQL(
            sql="\n            CREATE CONSTRAINT TRIGGER iaso_group_same_source_version_as_org_unit_constraint\n            AFTER INSERT OR UPDATE\n            ON iaso_group\n            DEFERRABLE INITIALLY DEFERRED\n            FOR EACH ROW\n            EXECUTE PROCEDURE iaso_group_org_units_same_source_version_group();",
            reverse_sql="\n            DROP TRIGGER iaso_group_same_source_version_as_org_unit_constraint\n            ON iaso_group;",
        ),
        migrations.RunSQL(
            sql="\n    CREATE OR REPLACE FUNCTION iaso_group_org_units_same_source_version_orgunit() RETURNS trigger AS\n    $F$\n    BEGIN\n        IF ((select count(*) from iaso_group_org_units go\n                join iaso_group on (iaso_group.id = go.group_id)\n                join iaso_orgunit on (iaso_orgunit.id = go.orgunit_id)\n                where go.orgunit_id = new.id\n                and iaso_orgunit.version_id != iaso_group.source_version_id) > 0)\n        THEN\n            RAISE EXCEPTION 'Constraint violation iaso_group_org_units_same_source_version_constraint';\n        END IF;\n        RETURN NEW;\n    END;\n    $F$ LANGUAGE plpgsql;",
            reverse_sql="DROP FUNCTION iaso_group_org_units_same_source_version_orgunit;",
        ),
        migrations.RunSQL(
            sql="\n            CREATE CONSTRAINT TRIGGER iaso_org_units_same_source_version_constraint\n            AFTER INSERT OR UPDATE\n            ON iaso_orgunit\n            DEFERRABLE INITIALLY DEFERRED\n            FOR EACH ROW\n            EXECUTE PROCEDURE iaso_group_org_units_same_source_version_orgunit();\n            ",
            reverse_sql="\n            DROP TRIGGER iaso_org_units_same_source_version_constraint ON iaso_orgunit;",
        ),
        migrations.RunSQL(
            sql=[
                # Index for filtering entities by type and deletion status.
                # This is tightly related to the `LevenshteinAlgorithm` SQL queries.
                "CREATE INDEX IF NOT EXISTS idx_entity_type_not_deleted "
                "ON iaso_entity(entity_type_id) WHERE deleted_at IS NULL;",
            ],
            reverse_sql=[
                "DROP INDEX CONCURRENTLY IF EXISTS idx_entity_type_not_deleted;",
            ],
        ),
    ]
