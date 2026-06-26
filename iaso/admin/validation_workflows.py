from django.contrib.admin import ModelAdmin, register

from iaso.models import ValidationWorkflow
from iaso.services.validation_workflows import ValidationWorkflowService


@register(ValidationWorkflow)
class ValidationWorkflowAdmin(ModelAdmin):
    def save_model(self, request, obj, form, change):
        if change:
            obj.save()
        else:
            ValidationWorkflowService.create(user=request.user, **form.cleaned_data)
