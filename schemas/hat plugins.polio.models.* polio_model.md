## hat plugins.polio.models.* polio's ER Diagram

```mermaid
%%{init: {'theme': 'neutral' } }%%
erDiagram
LogEntry{
AutoField id
DateTimeField action_time
TextField object_id
CharField object_repr
PositiveSmallIntegerField action_flag
TextField change_message
}
Permission{
AutoField id
CharField name
CharField codename
}
Group{
AutoField id
CharField name
}
User{
AutoField id
CharField password
DateTimeField last_login
BooleanField is_superuser
CharField username
CharField first_name
CharField last_name
CharField email
BooleanField is_staff
BooleanField is_active
DateTimeField date_joined
}
ContentType{
AutoField id
CharField app_label
CharField model
}
Session{
CharField session_key
TextField session_data
DateTimeField expire_date
}
PostGISGeometryColumns{
CharField f_table_catalog
CharField f_table_schema
CharField f_table_name
CharField f_geometry_column
IntegerField coord_dimension
IntegerField srid
CharField type
}
PostGISSpatialRefSys{
IntegerField srid
CharField auth_name
IntegerField auth_srid
CharField srtext
CharField proj4text
}
Site{
AutoField id
CharField domain
CharField name
}
EmailAddress{
AutoField id
CharField email
BooleanField verified
BooleanField primary
}
EmailConfirmation{
AutoField id
DateTimeField created
DateTimeField sent
CharField key
}
SocialApp{
AutoField id
CharField provider
CharField name
CharField client_id
CharField secret
CharField key
}
SocialAccount{
AutoField id
CharField provider
CharField uid
DateTimeField last_login
DateTimeField date_joined
TextField extra_data
}
SocialToken{
AutoField id
TextField token
TextField token_secret
DateTimeField expires_at
}
APIImport{
AutoField id
DateTimeField created_at
TextField import_type
JSONField json_body
JSONField headers
BooleanField has_problem
TextField exception
}
Modification{
AutoField id
CharField object_id
JSONField past_value
JSONField new_value
TextField source
DateTimeField created_at
GenericForeignKey content_object
}
CustomPermissionSupport{
AutoField id
}
DataSource{
AutoField id
CharField name
BooleanField read_only
TextField description
DateTimeField created_at
DateTimeField updated_at
}
SourceVersion{
AutoField id
IntegerField number
TextField description
DateTimeField created_at
DateTimeField updated_at
}
Project{
AutoField id
TextField name
TextField app_id
BooleanField needs_authentication
DateTimeField created_at
DateTimeField updated_at
UUIDField external_token
IntegerField min_version
}
OrgUnitType{
AutoField id
CharField name
CharField short_name
DateTimeField created_at
DateTimeField updated_at
CharField category
PositiveSmallIntegerField depth
}
OrgUnit{
AutoField id
CharField name
TextField uuid
BooleanField custom
BooleanField validated
CharField validation_status
TextField path
ArrayField aliases
TextField sub_source
TextField source_ref
MultiPolygonField geom
MultiPolygonField simplified_geom
MultiPolygonField catchment
IntegerField geom_ref
TextField gps_source
PointField location
DateTimeField created_at
DateTimeField updated_at
}
Device{
AutoField id
CharField imei
BooleanField test_device
DateTimeField created_at
DateTimeField updated_at
}
DeviceOwnership{
AutoField id
DateTimeField start
DateTimeField end
DateTimeField created_at
DateTimeField updated_at
}
DevicePosition{
AutoField id
UUIDField uuid
PointField location
CharField transport
DecimalField accuracy
DateTimeField captured_at
DateTimeField created_at
DateTimeField updated_at
}
Form{
AutoField id
DateTimeField deleted_at
TextField form_id
DateTimeField created_at
DateTimeField updated_at
TextField name
TextField device_field
TextField location_field
TextField correlation_field
BooleanField correlatable
JSONField possible_fields
TextField period_type
BooleanField single_per_period
IntegerField periods_before_allowed
IntegerField periods_after_allowed
BooleanField derived
UUIDField uuid
ArrayField label_keys
}
FormVersion{
AutoField id
FileField file
FileField xls_file
JSONField form_descriptor
TextField version_id
DateTimeField created_at
DateTimeField updated_at
TextField start_period
TextField end_period
JSONField possible_fields
}
FormPredefinedFilter{
AutoField id
TextField name
CharField short_name
JSONField json_logic
DateTimeField created_at
DateTimeField updated_at
}
FormAttachment{
AutoField id
TextField name
FileField file
CharField md5
DateTimeField created_at
DateTimeField updated_at
}
AccountFeatureFlag{
CharField name
CharField code
DateTimeField created_at
DateTimeField updated_at
}
Account{
AutoField id
TextField name
DateTimeField created_at
DateTimeField updated_at
TextField user_manual_path
}
RecordType{
AutoField id
TextField name
TextField description
DateTimeField created_at
}
Record{
AutoField id
DecimalField value
DateTimeField created_at
}
MatchingAlgorithm{
AutoField id
TextField name
TextField description
DateTimeField created_at
}
AlgorithmRun{
AutoField id
DateTimeField created_at
DateTimeField ended_at
JSONField result
BooleanField finished
}
Task{
AutoField id
DateTimeField created_at
DateTimeField started_at
DateTimeField ended_at
IntegerField progress_value
IntegerField end_value
JSONField result
CharField status
TextField name
JSONField params
JSONField queue_answer
TextField progress_message
BooleanField should_be_killed
}
Link{
AutoField id
BooleanField validated
DateTimeField validation_date
SmallIntegerField similarity_score
DateTimeField created_at
DateTimeField updated_at
}
Group{
AutoField id
TextField name
TextField source_ref
CharField domain
BooleanField block_of_countries
DateTimeField created_at
DateTimeField updated_at
}
GroupSet{
AutoField id
TextField name
TextField source_ref
DateTimeField created_at
DateTimeField updated_at
}
Mapping{
AutoField id
TextField name
TextField mapping_type
DateTimeField created_at
DateTimeField updated_at
}
MappingVersion{
AutoField id
TextField name
JSONField json
DateTimeField created_at
DateTimeField updated_at
}
ExternalCredentials{
AutoField id
TextField name
TextField login
TextField password
TextField url
}
Instance{
AutoField id
DateTimeField created_at
DateTimeField updated_at
TextField uuid
TextField export_id
BigIntegerField correlation_id
TextField name
FileField file
TextField file_name
PointField location
JSONField json
DecimalField accuracy
TextField period
DateTimeField last_export_success_at
BooleanField deleted
BooleanField to_export
}
InstanceFile{
AutoField id
DateTimeField created_at
DateTimeField updated_at
TextField name
FileField file
BooleanField deleted
}
Profile{
AutoField id
CharField external_user_id
CharField language
CharField dhis2_id
CharField home_page
}
ExportRequest{
BigAutoField id
JSONField params
JSONField result
BooleanField finished
TextField status
IntegerField instance_count
IntegerField exported_count
IntegerField errored_count
TextField last_error_message
BooleanField continue_on_error
DateTimeField queued_at
DateTimeField started_at
DateTimeField ended_at
}
ExportLog{
BigAutoField id
JSONField sent
JSONField received
DateTimeField created_at
IntegerField http_status
TextField url
}
ExportStatus{
BigAutoField id
TextField status
TextField last_error_message
DateTimeField created_at
}
FeatureFlag{
AutoField id
CharField code
CharField name
BooleanField requires_authentication
TextField description
DateTimeField created_at
DateTimeField updated_at
}
BulkCreateUserCsvFile{
AutoField id
FileField file
DateTimeField created_at
}
InstanceLock{
AutoField id
DateTimeField locked_at
DateTimeField unlocked_at
}
UserRole{
AutoField id
DateTimeField created_at
DateTimeField updated_at
}
Page{
AutoField id
TextField name
TextField content
BooleanField needs_authentication
SlugField slug
DateTimeField created_at
DateTimeField updated_at
CharField type
TextField powerbi_group_id
TextField powerbi_report_id
TextField powerbi_dataset_id
JSONField powerbi_filters
CharField powerbi_language
}
CommentIaso{
AutoField id
CharField object_pk
CharField user_name
CharField user_email
CharField user_url
TextField comment
DateTimeField submit_date
GenericIPAddressField ip_address
BooleanField is_public
BooleanField is_removed
GenericForeignKey content_object
}
ImportGPKG{
AutoField id
DateTimeField created_at
DateTimeField updated_at
FileField file
IntegerField version_number
CharField description
}
EntityType{
AutoField id
CharField name
DateTimeField created_at
DateTimeField updated_at
BooleanField is_active
ArrayField fields_list_view
ArrayField fields_detail_info_view
ArrayField fields_duplicate_search
}
Entity{
AutoField id
DateTimeField deleted_at
CharField name
UUIDField uuid
DateTimeField created_at
DateTimeField updated_at
}
StorageDevice{
AutoField id
CharField customer_chosen_id
CharField type
CharField status
CharField status_reason
TextField status_comment
DateTimeField status_updated_at
DateTimeField created_at
DateTimeField updated_at
}
StorageLogEntry{
UUIDField id
CharField operation_type
DateTimeField performed_at
CharField status
CharField status_reason
TextField status_comment
}
StoragePassword{
AutoField id
CharField password
BooleanField is_compromised
DateTimeField created_at
DateTimeField updated_at
}
Workflow{
AutoField id
DateTimeField deleted_at
DateTimeField created_at
DateTimeField updated_at
}
WorkflowVersion{
AutoField id
DateTimeField deleted_at
CharField name
CharField status
DateTimeField created_at
DateTimeField updated_at
}
WorkflowFollowup{
AutoField id
IntegerField order
JSONField condition
DateTimeField created_at
DateTimeField updated_at
}
WorkflowChange{
AutoField id
JSONField mapping
DateTimeField created_at
DateTimeField updated_at
}
ReportVersion{
AutoField id
DateTimeField deleted_at
FileField file
CharField name
DateTimeField created_at
DateTimeField updated_at
CharField status
}
Report{
AutoField id
DateTimeField deleted_at
CharField name
DateTimeField created_at
DateTimeField updated_at
}
EntityDuplicateAnalyzis{
AutoField id
CharField algorithm
DateTimeField created_at
JSONField metadata
DateTimeField finished_at
}
EntityDuplicate{
AutoField id
DateTimeField created_at
CharField validation_status
CharField type_of_relation
SmallIntegerField similarity_score
DateTimeField updated_at
JSONField metadata
}
Team{
AutoField id
DateTimeField deleted_at
CharField name
TextField description
TextField path
CharField type
DateTimeField created_at
DateTimeField updated_at
}
Planning{
AutoField id
DateTimeField deleted_at
CharField name
TextField description
DateField started_at
DateField ended_at
DateTimeField published_at
DateTimeField created_at
DateTimeField updated_at
}
Assignment{
AutoField id
DateTimeField deleted_at
DateTimeField created_at
DateTimeField updated_at
}
JsonDataStore{
AutoField id
SlugField slug
JSONField content
DateTimeField created_at
DateTimeField updated_at
}
Comment{
AutoField id
CharField object_pk
CharField user_name
CharField user_email
CharField user_url
TextField comment
DateTimeField submit_date
GenericIPAddressField ip_address
BooleanField is_public
BooleanField is_removed
GenericForeignKey content_object
}
CommentFlag{
AutoField id
CharField flag
DateTimeField flag_date
}
BudgetStep{
AutoField id
DateTimeField deleted_at
CharField transition_key
DateTimeField created_at
DateTimeField updated_at
TextField comment
DecimalField amount
BooleanField is_email_sent
CharField node_key_from
CharField node_key_to
}
BudgetStepFile{
AutoField id
FileField file
CharField filename
DateTimeField created_at
DateTimeField updated_at
}
BudgetStepLink{
AutoField id
DateTimeField deleted_at
CharField url
CharField alias
DateTimeField created_at
}
MailTemplate{
AutoField id
SlugField slug
TextField subject_template
TextField html_template
TextField text_template
DateTimeField created_at
DateTimeField updated_at
}
WorkflowModel{
AutoField id
DateTimeField created_at
DateTimeField updated_at
JSONField definition
}
RoundScope{
AutoField id
CharField vaccine
}
CampaignScope{
AutoField id
CharField vaccine
}
Destruction{
AutoField id
IntegerField vials_destroyed
DateField date_report_received
DateField date_report
TextField comment
}
Shipment{
AutoField id
CharField vaccine_name
IntegerField po_numbers
IntegerField vials_received
DateField estimated_arrival_date
DateField reception_pre_alert
DateField date_reception
TextField comment
}
RoundVaccine{
AutoField id
CharField name
IntegerField doses_per_vial
DecimalField wastage_ratio_forecast
}
RoundDateHistoryEntry{
AutoField id
DateField previous_started_at
DateField previous_ended_at
DateField started_at
DateField ended_at
CharField reason
DateTimeField created_at
}
Round{
AutoField id
DateField started_at
IntegerField number
DateField ended_at
DateField mop_up_started_at
DateField mop_up_ended_at
DateField im_started_at
DateField im_ended_at
DateField lqas_started_at
DateField lqas_ended_at
IntegerField target_population
IntegerField doses_requested
DecimalField cost
DecimalField im_percentage_children_missed_in_household
DecimalField im_percentage_children_missed_out_household
DecimalField im_percentage_children_missed_in_plus_out_household
DecimalField awareness_of_campaign_planning
CharField main_awareness_problem
IntegerField lqas_district_passing
IntegerField lqas_district_failing
CharField preparedness_spreadsheet_url
CharField preparedness_sync_status
DateField date_signed_vrf_received
DateField date_destruction
IntegerField vials_destroyed
IntegerField reporting_delays_hc_to_district
IntegerField reporting_delays_district_to_region
IntegerField reporting_delays_region_to_national
DateField forma_reception
IntegerField forma_missing_vials
IntegerField forma_usable_vials
IntegerField forma_unusable_vials
DateField forma_date
TextField forma_comment
IntegerField percentage_covered_target_population
}
Campaign{
DateTimeField deleted_at
UUIDField id
CharField epid
CharField obr_name
BooleanField is_preventive
BooleanField is_test
DateTimeField created_at
DateTimeField updated_at
CharField gpei_coordinator
CharField gpei_email
TextField description
BooleanField separate_scopes_per_round
BooleanField enable_send_weekly_email
JSONField geojson
DateTimeField creation_email_send_at
DateField onset_at
DateField outbreak_declaration_date
DateField cvdpv_notified_at
DateField cvdpv2_notified_at
DateField pv_notified_at
DateField pv2_notified_at
CharField virus
CharField vacine
CharField detection_status
CharField detection_responsible
DateField detection_first_draft_submitted_at
DateField detection_rrt_oprtt_approval_at
CharField risk_assessment_status
CharField risk_assessment_responsible
DateField investigation_at
DateField risk_assessment_first_draft_submitted_at
DateField risk_assessment_rrt_oprtt_approval_at
DateField ag_nopv_group_met_at
DateField dg_authorized_at
IntegerField verification_score
IntegerField doses_requested
CharField preperadness_spreadsheet_url
CharField preperadness_sync_status
CharField budget_status
CharField budget_responsible
CharField budget_current_state_key
CharField budget_current_state_label
DateField ra_completed_at_WFEDITABLE
DateField who_sent_budget_at_WFEDITABLE
DateField unicef_sent_budget_at_WFEDITABLE
DateField gpei_consolidated_budgets_at_WFEDITABLE
DateField submitted_to_rrt_at_WFEDITABLE
DateField feedback_sent_to_gpei_at_WFEDITABLE
DateField re_submitted_to_rrt_at_WFEDITABLE
DateField submitted_to_orpg_operations1_at_WFEDITABLE
DateField feedback_sent_to_rrt1_at_WFEDITABLE
DateField re_submitted_to_orpg_operations1_at_WFEDITABLE
DateField submitted_to_orpg_wider_at_WFEDITABLE
DateField submitted_to_orpg_operations2_at_WFEDITABLE
DateField feedback_sent_to_rrt2_at_WFEDITABLE
DateField re_submitted_to_orpg_operations2_at_WFEDITABLE
DateField submitted_for_approval_at_WFEDITABLE
DateField feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE
DateField feedback_sent_to_orpg_operations_who_at_WFEDITABLE
DateField approved_by_who_at_WFEDITABLE
DateField approved_by_unicef_at_WFEDITABLE
DateField approved_at_WFEDITABLE
DateField approval_confirmed_at_WFEDITABLE
DateField budget_requested_at_WFEDITABLE_old
DateField feedback_sent_to_rrt3_at_WFEDITABLE_old
DateField re_submitted_to_orpg_at_WFEDITABLE_old
DateField who_disbursed_to_co_at
DateField who_disbursed_to_moh_at
DateField unicef_disbursed_to_co_at
DateField unicef_disbursed_to_moh_at
DateField eomg
DecimalField no_regret_fund_amount
CharField payment_mode
IntegerField district_count
DateField budget_rrt_oprtt_approval_at
DateField budget_submitted_at
}
Preparedness{
UUIDField id
CharField spreadsheet_url
DecimalField national_score
DecimalField regional_score
DecimalField district_score
JSONField payload
DateTimeField created_at
}
Config{
AutoField id
SlugField slug
JSONField content
DateTimeField created_at
DateTimeField updated_at
}
CountryUsersGroup{
AutoField id
CharField language
DateTimeField created_at
DateTimeField updated_at
}
LineListImport{
AutoField id
FileField file
JSONField import_result
DateTimeField created_at
DateTimeField updated_at
}
URLCache{
AutoField id
CharField url
TextField content
DateTimeField created_at
DateTimeField updated_at
}
SpreadSheetImport{
AutoField id
DateTimeField created_at
CharField url
JSONField content
CharField spread_id
}
CampaignGroup{
AutoField id
DateTimeField deleted_at
DateTimeField created_at
DateTimeField updated_at
CharField name
}
BudgetEvent{
AutoField id
DateTimeField deleted_at
CharField type
BooleanField internal
DateTimeField created_at
DateTimeField updated_at
CharField status
CharField cc_emails
TextField comment
TextField links
BooleanField is_finalized
BooleanField is_email_sent
DecimalField amount
}
BudgetFiles{
AutoField id
FileField file
DateTimeField created_at
DateTimeField updated_at
}
Dashboard{
AutoField id
SlugField slug
CharField title
TextField description
DateTimeField created_at
CharField view_policy
CharField edit_policy
}
DashboardQuery{
AutoField id
TextField sql
IntegerField order
}
LogEntry||--|{User : user
LogEntry||--|{ContentType : content_type
Permission}|--|{Group : group
Permission}|--|{User : user
Permission||--|{ContentType : content_type
Group}|--|{User : user
Group||--||UserRole : iaso_user_role
Group||--|{Dashboard : can_view_dashboards
Group||--|{Dashboard : can_edit_dashboards
Group}|--|{Permission : permissions
User||--|{LogEntry : logentry
User||--|{EmailAddress : emailaddress
User||--|{SocialAccount : socialaccount
User||--|{APIImport : apiimport
User||--|{Modification : modification
User||--|{OrgUnit : orgunit
User||--|{DeviceOwnership : deviceownership
User||--|{AlgorithmRun : algorithmrun
User||--|{Task : task
User||--|{Link : link
User||--|{Instance : instance
User||--|{Instance : last_modified_by
User||--||Profile : iaso_profile
User||--|{ExportRequest : exportrequest
User||--|{BulkCreateUserCsvFile : bulkcreateusercsvfile
User||--|{InstanceLock : instancelock
User}|--|{Page : pages
User||--|{CommentIaso : commentiaso_comments
User||--|{StorageLogEntry : storagelogentry
User||--|{Team : managed_teams
User||--|{Team : team
User}|--|{Team : teams
User||--|{Planning : planning
User||--|{Assignment : assignments
User||--|{Assignment : assignments_created
User||--|{Comment : comment_comments
User||--|{CommentFlag : comment_flags
User||--|{BudgetStep : budgetstep
User||--|{RoundDateHistoryEntry : rounddatehistoryentry
User}|--|{Config : polioconfigs
User}|--|{CountryUsersGroup : countryusersgroup
User||--|{LineListImport : linelistimport
User||--|{URLCache : urlcache
User||--|{BudgetEvent : budgetevent
User||--|{Dashboard : owned_dashboards
User}|--|{Group : groups
User}|--|{Permission : user_permissions
ContentType||--|{LogEntry : logentry
ContentType||--|{Permission : permission
ContentType||--|{Modification : modification
ContentType||--|{CommentIaso : content_type_set_for_commentiaso2
ContentType||--|{Comment : content_type_set_for_comment
Site}|--|{SocialApp : socialapp
Site||--|{CommentIaso : commentiaso
Site||--|{Comment : comment
EmailAddress||--|{EmailConfirmation : emailconfirmation
EmailAddress||--|{User : user
EmailConfirmation||--|{EmailAddress : email_address
SocialApp||--|{SocialToken : socialtoken
SocialApp}|--|{Site : sites
SocialAccount||--|{SocialToken : socialtoken
SocialAccount||--|{User : user
SocialToken||--|{SocialApp : app
SocialToken||--|{SocialAccount : account
APIImport||--|{User : user
Modification||--|{ContentType : content_type
Modification||--|{User : user
DataSource||--|{SourceVersion : versions
DataSource||--|{Mapping : mappings
DataSource||--|{ImportGPKG : importgpkg
DataSource||--|{ExternalCredentials : credentials
DataSource||--|{SourceVersion : default_version
DataSource}|--|{Project : projects
SourceVersion||--|{DataSource : datasource
SourceVersion||--|{OrgUnit : orgunit
SourceVersion||--|{Account : account
SourceVersion||--|{Record : record
SourceVersion||--|{AlgorithmRun : runs_where_destination
SourceVersion||--|{AlgorithmRun : runs_where_source
SourceVersion||--|{Group : group
SourceVersion||--|{GroupSet : groupset
SourceVersion||--|{DataSource : data_source
Project}|--|{DataSource : data_sources
Project}|--|{OrgUnitType : unit_types
Project}|--|{Device : devices
Project||--|{DeviceOwnership : deviceownership
Project}|--|{RecordType : record_types
Project}|--|{MatchingAlgorithm : match_algos
Project||--|{Instance : instance
Project}|--|{Profile : iaso_profile
Project||--|{ImportGPKG : importgpkg
Project||--|{StoragePassword : storage_passwords
Project||--|{Report : report
Project||--|{Team : team
Project||--|{Planning : planning
Project||--|{Account : account
Project}|--|{Form : forms
Project}|--|{FeatureFlag : feature_flags
OrgUnitType}|--|{OrgUnitType : super_types
OrgUnitType}|--|{OrgUnitType : create_types
OrgUnitType||--|{OrgUnit : orgunit
OrgUnitType}|--|{Form : form
OrgUnitType||--|{Form : reference_form
OrgUnitType}|--|{OrgUnitType : sub_unit_types
OrgUnitType}|--|{OrgUnitType : allow_creating_sub_unit_types
OrgUnitType}|--|{Project : projects
OrgUnit||--|{OrgUnit : orgunit
OrgUnit||--|{Record : record
OrgUnit||--|{Link : source_set
OrgUnit||--|{Link : destination_set
OrgUnit}|--|{Group : groups
OrgUnit||--|{Instance : instance
OrgUnit}|--|{Profile : iaso_profile
OrgUnit||--|{InstanceLock : instance_lock
OrgUnit||--|{StorageDevice : storagedevice
OrgUnit||--|{StorageLogEntry : storagelogentry
OrgUnit||--|{Planning : planning
OrgUnit||--|{Assignment : assignment
OrgUnit||--|{Campaign : campaigns
OrgUnit||--|{Campaign : campaigns_country
OrgUnit||--||CountryUsersGroup : countryusersgroup
OrgUnit||--|{SourceVersion : version
OrgUnit||--|{OrgUnit : parent
OrgUnit||--|{OrgUnitType : org_unit_type
OrgUnit||--|{Instance : reference_instance
OrgUnit||--|{User : creator
Device||--|{DeviceOwnership : deviceownership
Device||--|{DevicePosition : deviceposition
Device||--|{Instance : instance
Device}|--|{Project : projects
DeviceOwnership||--|{Device : device
DeviceOwnership||--|{Project : project
DeviceOwnership||--|{User : user
DevicePosition||--|{Device : device
Form}|--|{Project : projects
Form||--|{OrgUnitType : orgunittype
Form||--|{FormVersion : form_versions
Form||--|{FormPredefinedFilter : predefined_filters
Form||--|{FormAttachment : attachments
Form||--|{Mapping : mapping
Form||--|{Instance : instances
Form||--|{EntityType : entitytype
Form}|--|{WorkflowFollowup : workflowfollowup
Form||--|{WorkflowChange : workflowchange
Form}|--|{Planning : plannings
Form}|--|{OrgUnitType : org_unit_types
FormVersion||--|{MappingVersion : mapping_versions
FormVersion||--|{Instance : form_version
FormVersion||--|{Form : form
FormPredefinedFilter||--|{Form : form
FormAttachment||--|{Form : form
AccountFeatureFlag}|--|{Account : account
Account||--|{Project : project
Account||--|{Task : task
Account||--|{ExternalCredentials : credentials
Account||--|{Profile : profile
Account||--|{BulkCreateUserCsvFile : bulkcreateusercsvfile
Account||--|{UserRole : userrole
Account||--|{Page : page
Account||--|{EntityType : entitytype
Account||--|{Entity : entity
Account||--|{StorageDevice : storagedevice
Account||--|{JsonDataStore : jsondatastore
Account||--|{Campaign : campaigns
Account||--|{SourceVersion : default_version
Account}|--|{AccountFeatureFlag : feature_flags
RecordType||--|{Record : record
RecordType}|--|{Project : projects
Record||--|{SourceVersion : version
Record||--|{OrgUnit : org_unit
Record||--|{RecordType : record_type
MatchingAlgorithm||--|{AlgorithmRun : algorithmrun
MatchingAlgorithm}|--|{Project : projects
AlgorithmRun||--|{Link : link
AlgorithmRun||--|{MatchingAlgorithm : algorithm
AlgorithmRun||--|{User : launcher
AlgorithmRun||--|{SourceVersion : version_1
AlgorithmRun||--|{SourceVersion : version_2
Task||--|{EntityDuplicateAnalyzis : entity_duplicate_analyzis
Task||--|{Account : account
Task||--|{User : launcher
Link||--|{OrgUnit : destination
Link||--|{OrgUnit : source
Link||--|{User : validator
Link||--|{AlgorithmRun : algorithm_run
Group}|--|{GroupSet : group_sets
Group||--||RoundScope : roundScope
Group||--||CampaignScope : campaignScope
Group||--|{Campaign : campaigns
Group||--|{SourceVersion : source_version
Group}|--|{OrgUnit : org_units
GroupSet||--|{SourceVersion : source_version
GroupSet}|--|{Group : groups
Mapping||--|{MappingVersion : versions
Mapping||--|{DataSource : data_source
Mapping||--|{Form : form
MappingVersion||--|{ExportStatus : exportstatus
MappingVersion||--|{FormVersion : form_version
MappingVersion||--|{Mapping : mapping
ExternalCredentials||--|{DataSource : data_sources
ExternalCredentials||--|{Account : account
Instance||--|{OrgUnit : orgunit
Instance||--|{InstanceFile : instancefile
Instance||--|{ExportStatus : exportstatus
Instance||--|{InstanceLock : instancelock
Instance||--||Entity : attributes
Instance}|--|{StorageLogEntry : storage_log_entries
Instance||--|{User : created_by
Instance||--|{User : last_modified_by
Instance||--|{OrgUnit : org_unit
Instance||--|{Form : form
Instance||--|{Project : project
Instance||--|{Device : device
Instance||--|{Entity : entity
Instance||--|{Planning : planning
Instance||--|{FormVersion : form_version
InstanceFile||--|{Instance : instance
Profile||--|{Account : account
Profile||--||User : user
Profile}|--|{OrgUnit : org_units
Profile}|--|{UserRole : user_roles
Profile}|--|{Project : projects
ExportRequest||--|{ExportStatus : exportstatus
ExportRequest||--|{User : launcher
ExportLog}|--|{ExportStatus : exportstatus
ExportStatus||--|{ExportRequest : export_request
ExportStatus||--|{Instance : instance
ExportStatus||--|{MappingVersion : mapping_version
ExportStatus}|--|{ExportLog : export_logs
BulkCreateUserCsvFile||--|{User : created_by
BulkCreateUserCsvFile||--|{Account : account
InstanceLock||--|{Instance : instance
InstanceLock||--|{User : locked_by
InstanceLock||--|{User : unlocked_by
InstanceLock||--|{OrgUnit : top_org_unit
UserRole}|--|{Profile : iaso_profile
UserRole||--|{Account : account
UserRole||--||Group : group
Page||--|{Account : account
Page}|--|{User : users
CommentIaso||--|{CommentIaso : children
CommentIaso||--|{Site : site
CommentIaso||--|{User : user
CommentIaso||--|{CommentIaso : parent
CommentIaso||--|{ContentType : content_type
ImportGPKG||--|{Project : project
ImportGPKG||--|{DataSource : data_source
EntityType||--|{Entity : entity
EntityType||--||Workflow : workflow
EntityType||--|{Form : reference_form
EntityType||--|{Account : account
Entity||--|{Instance : instances
Entity||--|{StorageDevice : storagedevice
Entity||--|{StorageLogEntry : storagelogentry
Entity||--|{EntityDuplicate : duplicates1
Entity||--|{EntityDuplicate : duplicates2
Entity||--|{EntityType : entity_type
Entity||--||Instance : attributes
Entity||--|{Account : account
StorageDevice||--|{StorageLogEntry : log_entries
StorageDevice||--|{Account : account
StorageDevice||--|{OrgUnit : org_unit
StorageDevice||--|{Entity : entity
StorageLogEntry||--|{StorageDevice : device
StorageLogEntry||--|{User : performed_by
StorageLogEntry||--|{OrgUnit : org_unit
StorageLogEntry||--|{Entity : entity
StorageLogEntry}|--|{Instance : instances
StoragePassword||--|{Project : project
Workflow||--|{WorkflowVersion : workflow_versions
Workflow||--||EntityType : entity_type
WorkflowVersion||--|{WorkflowFollowup : follow_ups
WorkflowVersion||--|{WorkflowChange : changes
WorkflowVersion||--|{Workflow : workflow
WorkflowFollowup||--|{WorkflowVersion : workflow_version
WorkflowFollowup}|--|{Form : forms
WorkflowChange||--|{Form : form
WorkflowChange||--|{WorkflowVersion : workflow_version
ReportVersion||--|{Report : report
Report||--|{ReportVersion : published_version
Report||--|{Project : project
EntityDuplicateAnalyzis||--|{EntityDuplicate : duplicates
EntityDuplicateAnalyzis||--|{Task : task
EntityDuplicate||--|{Entity : entity1
EntityDuplicate||--|{Entity : entity2
EntityDuplicate||--|{EntityDuplicateAnalyzis : analyze
Team||--|{Team : sub_teams
Team||--|{Planning : planning
Team||--|{Assignment : assignment
Team||--|{BudgetStep : budgetstep
Team}|--|{CountryUsersGroup : countryusersgroup
Team}|--|{BudgetEvent : budgetevent
Team||--|{Project : project
Team||--|{User : manager
Team||--|{Team : parent
Team||--|{User : created_by
Team}|--|{User : users
Planning||--|{Instance : instances
Planning||--|{Assignment : assignment
Planning||--|{Project : project
Planning||--|{Team : team
Planning||--|{OrgUnit : org_unit
Planning||--|{User : created_by
Planning}|--|{Form : forms
Assignment||--|{Planning : planning
Assignment||--|{OrgUnit : org_unit
Assignment||--|{User : user
Assignment||--|{Team : team
Assignment||--|{User : created_by
JsonDataStore||--|{Account : account
Comment||--|{CommentFlag : flags
Comment||--|{ContentType : content_type
Comment||--|{Site : site
Comment||--|{User : user
CommentFlag||--|{User : user
CommentFlag||--|{Comment : comment
BudgetStep||--|{BudgetStepFile : files
BudgetStep||--|{BudgetStepLink : links
BudgetStep||--|{Campaign : campaign
BudgetStep||--|{User : created_by
BudgetStep||--|{Team : created_by_team
BudgetStepFile||--|{BudgetStep : step
BudgetStepLink||--|{BudgetStep : step
RoundScope||--||Group : group
RoundScope||--|{Round : round
CampaignScope||--||Group : group
CampaignScope||--|{Campaign : campaign
Destruction||--|{Round : round
Shipment||--|{Round : round
RoundVaccine||--|{Round : round
RoundDateHistoryEntry||--|{Round : round
RoundDateHistoryEntry||--|{User : modified_by
Round||--|{RoundScope : scopes
Round||--|{Destruction : destructions
Round||--|{Shipment : shipments
Round||--|{RoundVaccine : vaccines
Round||--|{RoundDateHistoryEntry : datelogs
Round||--||Campaign : campaign_round_one
Round||--||Campaign : campaign_round_two
Round||--|{Campaign : campaign
Campaign||--|{BudgetStep : budget_steps
Campaign||--|{CampaignScope : scopes
Campaign||--|{Round : rounds
Campaign||--|{Preparedness : preparedness
Campaign}|--|{CampaignGroup : grouped_campaigns
Campaign||--|{BudgetEvent : budget_events
Campaign||--|{Account : account
Campaign||--|{OrgUnit : initial_org_unit
Campaign||--|{OrgUnit : country
Campaign||--|{Group : group
Campaign||--|{BudgetEvent : last_budget_event
Campaign||--||Round : round_one
Campaign||--||Round : round_two
Preparedness||--|{Campaign : campaign
Config}|--|{User : users
CountryUsersGroup||--||OrgUnit : country
CountryUsersGroup}|--|{User : users
CountryUsersGroup}|--|{Team : teams
LineListImport||--|{User : created_by
URLCache||--|{User : created_by
CampaignGroup}|--|{Campaign : campaigns
BudgetEvent||--|{Campaign : lastbudgetevent
BudgetEvent||--|{BudgetFiles : event_files
BudgetEvent||--|{Campaign : campaign
BudgetEvent||--|{User : author
BudgetEvent}|--|{Team : target_teams
BudgetFiles||--|{BudgetEvent : event
Dashboard||--|{DashboardQuery : queries
Dashboard||--|{User : owned_by
Dashboard||--|{Group : view_group
Dashboard||--|{Group : edit_group
DashboardQuery||--|{Dashboard : dashboard
```
