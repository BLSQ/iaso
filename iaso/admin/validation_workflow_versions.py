from django.contrib.admin import ModelAdmin, display, register

from iaso.models import ValidationWorkflowVersion


@register(ValidationWorkflowVersion)
class ValidationWorkflowVersionAdmin(ModelAdmin):
    list_display = ("version", "main_workflow", "get_account")

    @display(description="Account")
    def get_account(self, obj):
        return obj.main_workflow.account if obj.main_workflow else None
