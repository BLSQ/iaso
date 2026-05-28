from django.contrib import admin
from django.db import models

from iaso.admin.utils import IasoJSONEditorWidget
from iaso.models import Workflow, WorkflowChange, WorkflowFollowup, WorkflowVersion


@admin.register(Workflow)
class WorkflowAdmin(admin.ModelAdmin):
    readonly_fields = ("created_at", "updated_at")

    def get_form(self, request, obj=None, **kwargs):
        # In the <select> for the entity type, we also want to indicate the account name
        form = super().get_form(request, obj, **kwargs)
        form.base_fields["entity_type"].label_from_instance = lambda entity: (
            f"{entity.name} (Account: {entity.account.name})"
        )
        return form

    def get_queryset(self, request):
        return Workflow.objects_include_deleted.all()


class WorkflowChangeInline(admin.TabularInline):
    model = WorkflowChange
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}


class WorkflowFollowupInline(admin.TabularInline):
    model = WorkflowFollowup
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}


@admin.register(WorkflowVersion)
class WorkflowVersionAdmin(admin.ModelAdmin):
    readonly_fields = ("created_at", "updated_at")
    inlines = [WorkflowChangeInline, WorkflowFollowupInline]
    list_filter = ("workflow", "status")

    def get_queryset(self, request):
        return WorkflowVersion.objects_include_deleted.all()
