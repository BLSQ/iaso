from django.contrib import admin
from django.contrib.auth.models import User

from .base import IasoJSONEditorWidget  # noqa: F401
from .metric_admin import MetricTypeAdmin, MetricValueAdmin  # noqa
from .missions import MissionWithForms  # noqa
from .openhexa_admin import OpenHEXAInstanceAdmin, OpenHEXAWorkspaceAdmin  # noqa
from .planning_configs import PlanningConfigAdmin  # noqa
from .plannings import PlanningAdmin  # noqa
from .user_admin import UserAdmin


# unregister old user admin
admin.site.unregister(User)
# register new user admin
admin.site.register(User, UserAdmin)
