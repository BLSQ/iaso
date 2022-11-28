from typing import Union, List

from django.conf.urls import url
from django.urls import path, include, URLPattern, URLResolver
from django.contrib import auth
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView  # type: ignore

from hat.api.authentication import WfpLogin, wfp_callback
from .api.bulk_create_users import BulkCreateUserFromCsvViewSet
from .api.comment import CommentViewSet
from .api.completeness_stats import CompletenessStatsViewSet
from .api.entity import EntityViewSet, EntityTypeViewSet
from .api.logs import LogsViewSet
from .api.microplanning import TeamViewSet, PlanningViewSet, AssignmentViewSet, MobilePlanningViewSet
from .api.mobile.org_units import MobileOrgUnitViewSet
from .api.org_units import OrgUnitViewSet
from .api.org_unit_types import OrgUnitTypeViewSet
from .api.apps import AppsViewSet
from .api.pages import PagesViewSet
from .api.projects import ProjectsViewSet
from .api.instances import InstancesViewSet
from .api.devices import DevicesViewSet
from .api.devices_ownership import DevicesOwnershipViewSet
from .api.devices_position import DevicesPositionViewSet
from .api.data_sources import DataSourceViewSet
from iaso.api.tasks.create.org_units_bulk_update import OrgUnitsBulkUpdate
from iaso.api.tasks.create.copy_version import CopyVersionViewSet
from iaso.api.tasks.create.dhis2_ou_importer import Dhis2OuImporterViewSet
from .api.setup_account import SetupAccountViewSet
from .api.source_versions import SourceVersionViewSet
from .api.forms import FormsViewSet, MobileFormViewSet
from .api.form_versions import FormVersionsViewSet
from .api.links import LinkViewSet
from .api.profiles import ProfilesViewSet
from .api.algorithms import AlgorithmsViewSet
from .api.algorithms_runs import AlgorithmsRunsViewSet
from .api.groups import GroupsViewSet
from .api.periods import PeriodsViewSet
from .api.completeness import CompletenessViewSet
from .api.export_requests import ExportRequestsViewSet
from .api.storage import StorageLogViewSet, StorageViewSet, logs_per_device, StorageBlacklistedViewSet

from .api.tasks import TaskSourceViewSet
from .api.accounts import AccountViewSet
from plugins.router import router as plugins_router
from .api.enketo import (
    enketo_edit_url,
    enketo_create_url,
    enketo_form_list,
    EnketoSubmissionAPIView,
    enketo_form_download,
    enketo_public_launch,
    enketo_public_create_url,
)
from .api.mappings import MappingsViewSet
from .api.mapping_versions import MappingVersionsViewSet
from iaso.models import MatchingAlgorithm
from .api.derived_instances import DerivedInstancesViewSet
from .api.hesabu_descriptors import HesabuDescriptorsViewSet
from .api.dhis2_resources import DHIS2_VIEWSETS
from .api.permissions import PermissionsViewSet
from .api.feature_flags import FeatureFlagViewSet
from .api.check_version import CheckVersionViewSet
from iaso import matching
import pkgutil

from .api.tasks.create.import_gpkg import ImportGPKGViewSet
from .dhis2.authentication import dhis2_callback  # type: ignore
from hat.api.token_authentication import token_auth

from .api.workflows import WorkflowVersionViewSet
from .api.mobile.workflows import MobileWorkflowViewSet

URL = Union[URLPattern, URLResolver]
URLList = List[URL]

router = routers.DefaultRouter()
router.register(r"orgunits", OrgUnitViewSet, basename="orgunits")

router.register(r"orgunittypes", OrgUnitTypeViewSet, basename="orgunittypes")
router.register(r"apps", AppsViewSet, basename="apps")
router.register(r"projects", ProjectsViewSet, basename="projects")
router.register(r"instances", InstancesViewSet, basename="instances")
router.register(r"forms", FormsViewSet, basename="forms")
router.register(r"mobile/forms", MobileFormViewSet, basename="formsmobile")
router.register(r"pages", PagesViewSet, basename="pages")
router.register(r"formversions", FormVersionsViewSet, basename="formversions")
router.register(r"periods", PeriodsViewSet, basename="periods")
router.register(r"devices", DevicesViewSet, basename="devices")
router.register(r"devicesownership", DevicesOwnershipViewSet, basename="devicesownership")
router.register(r"devicesposition", DevicesPositionViewSet, basename="devicesposition")
router.register(r"datasources", DataSourceViewSet, basename="datasources")
router.register(r"accounts", AccountViewSet, basename="accounts")
router.register(r"sourceversions", SourceVersionViewSet, basename="sourceversion")
router.register(r"links", LinkViewSet, basename="links")
router.register(r"logs", LogsViewSet, basename="logs")
router.register(r"profiles", ProfilesViewSet, basename="profiles")
router.register(r"algorithms", AlgorithmsViewSet, basename="algorithms")
router.register(r"algorithmsruns", AlgorithmsRunsViewSet, basename="algorithmsruns")
router.register(r"groups", GroupsViewSet, basename="groups")
router.register(r"completeness", CompletenessViewSet, basename="completeness")
router.register(r"completeness_stats", CompletenessStatsViewSet, basename="completeness_stats")
router.register(r"exportrequests", ExportRequestsViewSet, basename="exportrequests")
router.register(r"mappings", MappingsViewSet, basename="mappings")
router.register(r"mappingversions", MappingVersionsViewSet, basename="mappingversions")
router.register(r"permissions", PermissionsViewSet, basename="permissions")
router.register(r"derivedinstances", DerivedInstancesViewSet, basename="derivedinstances")
router.register(r"mobile/orgunits", MobileOrgUnitViewSet, basename="orgunitsmobile")
router.register(r"featureflags", FeatureFlagViewSet, basename="featureflags")
router.register(r"mobile/checkversion", CheckVersionViewSet, basename="checkversion")
router.register(r"copyversion", CopyVersionViewSet, basename="copyversion")
router.register(r"dhis2ouimporter", Dhis2OuImporterViewSet, basename="dhis2ouimporter")
router.register(r"setupaccount", SetupAccountViewSet, basename="setupaccount")
router.register(r"tasks/create/orgunitsbulkupdate", OrgUnitsBulkUpdate, basename="orgunitsbulkupdate")
router.register(r"tasks/create/importgpkg", ImportGPKGViewSet, basename="importgpkg")
router.register(r"tasks", TaskSourceViewSet, basename="tasks")
router.register(r"comments", CommentViewSet, basename="comments")
router.register(r"entity", EntityViewSet, basename="entity")
router.register(r"entitytype", EntityTypeViewSet, basename="entitytype")
# At the moment we use the same view set but separate it for the future for when we want to be able to
# change the format in the future
router.register(r"mobile/entitytype", EntityTypeViewSet, basename="entitytype")
router.register(r"bulkcreateuser", BulkCreateUserFromCsvViewSet, basename="bulkcreateuser")
router.register(r"microplanning/teams", TeamViewSet, basename="teams")
router.register(r"microplanning/planning", PlanningViewSet, basename="planning")
router.register(r"microplanning/assignments", AssignmentViewSet, basename="assignments")
router.register(r"mobile/plannings", MobilePlanningViewSet, basename="mobileplanning")
router.register(r"storage", StorageViewSet, basename="storage")
router.register(r"mobile/storage/logs", StorageLogViewSet, basename="storagelogs")
router.register(r"mobile/storage/blacklisted", StorageBlacklistedViewSet, basename="storageblacklisted")

router.register(r"workflow", WorkflowVersionViewSet, basename="workflow")
router.register(r"mobile/workflow", MobileWorkflowViewSet, basename="mobileworkflow")

router.registry.extend(plugins_router.registry)

urlpatterns: URLList = [
    path(
        "fill/<form_uuid>/<org_unit_id>/<period>",
        view=enketo_public_launch,
        name="enketo_public_launch",
    ),
    path("enketo/create/", view=enketo_create_url, name="enketo-create-url"),
    path("enketo/public_create_url/", view=enketo_public_create_url, name="enketo_public_create_url"),
    path("enketo/edit/<instance_uuid>/", view=enketo_edit_url, name="enketo-edit-url"),
    path("enketo/formList", view=enketo_form_list, name="enketo-form-list"),
    path("enketo/formDownload/", view=enketo_form_download, name="enketo_form_download"),
    path("enketo/submission", view=EnketoSubmissionAPIView.as_view(), name="enketo-submission"),
    path("logout-iaso", auth.views.LogoutView.as_view(next_page="login"), name="logout-iaso"),
]


def append_datasources_subresource(viewset, resource_name, urlpatterns):
    urlpatterns.append(
        path(
            "datasources/<datasource_id>/" + resource_name + "/",
            view=viewset.as_view({"get": "list"}),
            name=resource_name,
        )
    )
    urlpatterns.append(
        path(
            "datasources/<datasource_id>/" + resource_name + ".<format>",
            view=viewset.as_view({"get": "list"}),
            name=resource_name,
        )
    )


urlpatterns = urlpatterns + [
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("storage/<str:storage_type>/<str:storage_customer_chosen_id>/logs", logs_per_device),
    path("", include(router.urls)),
]
# External Auth
urlpatterns = urlpatterns + [
    url("auth0/login/callback/", wfp_callback, name="callback"),
    path("", include("allauth.urls")),
    path("auth0/login/", WfpLogin.as_view(), name="openid"),
    path("dhis2/<dhis2_slug>/login/", dhis2_callback, name="dhis2_callback"),
    path("token_auth/", token_auth),
]


for dhis2_resource in DHIS2_VIEWSETS:
    append_datasources_subresource(dhis2_resource, dhis2_resource.resource, urlpatterns)

append_datasources_subresource(HesabuDescriptorsViewSet, HesabuDescriptorsViewSet.resource, urlpatterns)

##########   creating algorithms in the database so that they will appear in the API  ##########
try:
    import importlib

    for pkg in pkgutil.iter_modules(matching.__path__):
        full_name = "iaso.matching." + pkg.name
        algo_module = importlib.import_module(full_name)
        algo = algo_module.Algorithm()
        MatchingAlgorithm.objects.get_or_create(name=full_name, defaults={"description": algo.description})

except Exception as e:
    print("!! failed to create MatchingAlgorithm based on code, probably in manage.py migrate", e)
