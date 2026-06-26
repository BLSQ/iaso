from django.contrib import admin
from django.contrib.auth.models import User

from .base import IasoJSONEditorWidget  # noqa: F401
from .metric_admin import *
from .openhexa_admin import *
from .user_admin import UserAdmin
from .validation_workflow_versions import ValidationWorkflowVersionAdmin  # noqa: F401
from .validation_workflows import ValidationWorkflowAdmin  # noqa: F401


# unregister old user admin
admin.site.unregister(User)
# register new user admin
admin.site.register(User, UserAdmin)
