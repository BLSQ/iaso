## hat's ER Diagram

```mermaid
%%{init: {'theme': 'neutral' } }%%
erDiagram
Form{
ManyToManyField projects
ForeignKey orgunittype
ForeignKey mapping
ForeignKey instances
ManyToManyField teams
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
ManyToManyField org_unit_types
}
FormVersion{
ForeignKey mapping_versions
AutoField id
FileField file
FileField xls_file
JSONField form_descriptor
TextField version_id
DateTimeField created_at
DateTimeField updated_at
TextField start_period
TextField end_period
}
EntityType{
ForeignKey entity
AutoField id
CharField name
DateTimeField created_at
DateTimeField updated_at
ForeignKey account
BooleanField is_active
ArrayField fields_list_view
ArrayField fields_detail_info_view
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
Form||--|{FormVersion : form_versions
Form||--|{EntityType : entitytype
Form||--|{WorkflowVersion : workflowversion
Form}|--|{WorkflowFollowup : workflowfollowup
Form||--|{WorkflowChange : workflowchange
FormVersion||--|{Form : form
EntityType||--||Workflow : workflow
EntityType||--|{Form : reference_form
Workflow||--|{WorkflowVersion : workflow_versions
Workflow||--||EntityType : entity_type
WorkflowVersion||--|{WorkflowFollowup : follow_ups
WorkflowVersion||--|{WorkflowChange : changes
WorkflowVersion||--|{Workflow : workflow
WorkflowVersion||--|{Form : reference_form
WorkflowFollowup||--|{WorkflowVersion : workflow_version
WorkflowFollowup}|--|{Form : forms
WorkflowChange||--|{Form : form
WorkflowChange||--|{WorkflowVersion : workflow_version
```
