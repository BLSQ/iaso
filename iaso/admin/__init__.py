from django.contrib import admin
from django.contrib.auth.models import User

from .assignments import AssignmentAdmin  # noqa: F401
from .base import IasoJSONEditorWidget  # noqa: F401
from .metric_admin import MetricTypeAdmin, MetricValueAdmin  # noqa
from .missions import MissionWithFormsAdmin  # noqa
from .openhexa_admin import OpenHEXAInstanceAdmin, OpenHEXAWorkspaceAdmin  # noqa
from .planning_configs import PlanningConfigAdmin  # noqa
from .planning_samplings import PlanningSamplingResultAdmin  # noqa: F401
from .plannings import PlanningAdmin  # noqa
from .user_admin import UserAdmin
from .workspace_admin import WorkspaceAdmin  # noqa: F401


# unregister old user admin
admin.site.unregister(User)
# register new user admin
admin.site.register(User, UserAdmin)
