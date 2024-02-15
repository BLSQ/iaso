from rest_framework import routers

from plugins.polio.api.campaigns.campaign_groups import CampaignGroupViewSet
from plugins.polio.api.campaigns.campaigns import CampaignViewSet
from plugins.polio.api.campaigns.orgunits_per_campaigns import OrgUnitsPerCampaignViewset
from iaso.api.config import ConfigViewSet
from plugins.polio.api.country_user_groups import CountryUsersGroupViewSet
from plugins.polio.api.dashboards.forma import FormAStocksViewSet
from plugins.polio.api.dashboards.forma import FormAStocksViewSetV2
from plugins.polio.api.dashboards.launch_powerbi import LaunchPowerBIRefreshViewSet
from plugins.polio.api.dashboards.preparedness_dashboard import PreparednessDashboardViewSet
from plugins.polio.api.dashboards.rounds import RoundDashboardViewSet
from plugins.polio.api.dashboards.spreadsheetimport import SpreadSheetImportViewSet
from plugins.polio.api.dashboards.supply_chain import (
    PreAlertDashboardViewSet,
    VaccineArrivalReportDashboardViewSet,
    VaccineRequestFormDashboardViewSet,
)
from plugins.polio.api.dashboards.vaccine_stocks import VaccineStocksViewSet
from plugins.polio.api.lqas_im.countries_with_lqas_im import CountriesWithLqasIMConfigViewSet
from plugins.polio.api.lqas_im.im_stats import IMStatsViewSet
from plugins.polio.api.lqas_im.lqas_country import LQASCountryViewset
from plugins.polio.api.lqas_im.lqasim_global_map import LQASIMGlobalMapViewSet
from plugins.polio.api.lqas_im.lqasim_zoom_in_map import LQASIMZoominMapBackgroundViewSet, LQASIMZoominMapViewSet
from plugins.polio.api.notifications.views import NotificationViewSet
from plugins.polio.api.polio_org_units import PolioOrgunitViewSet
from plugins.polio.api.rounds.reasons_for_delay import ReasonForDelayViewSet
from plugins.polio.api.rounds.round import RoundViewSet
from plugins.polio.api.rounds.round_date_history import RoundDateHistoryEntryViewset
from plugins.polio.api.vaccines.vaccine_authorization import VaccineAuthorizationViewSet
from plugins.polio.budget.api import BudgetCampaignViewSet, BudgetStepViewSet, WorkflowViewSet
from plugins.polio.tasks.api.create_refresh_preparedness_data import RefreshPreparednessLaucherViewSet
from plugins.polio.api.vaccines.supply_chain import (
    VaccineRequestFormViewSet,
)
from plugins.polio.api.vaccines.stock_management import (
    VaccineStockManagementViewSet,
    OutgoingStockMovementViewSet,
    DestructionReportViewSet,
    IncidentReportViewSet,
)

from plugins.polio.tasks.api.refresh_lqas_data import RefreshLQASDataViewset

router = routers.SimpleRouter()
router.register(r"polio/orgunits", PolioOrgunitViewSet, basename="PolioOrgunit")
router.register(r"polio/campaigns", CampaignViewSet, basename="Campaign")
router.register(r"polio/budget", BudgetCampaignViewSet, basename="BudgetCampaign")
router.register(r"polio/budgetsteps", BudgetStepViewSet, basename="BudgetStep")
router.register(r"polio/workflow", WorkflowViewSet, basename="BudgetWorkflow")
router.register(r"polio/campaignsgroup", CampaignGroupViewSet, basename="campaigngroup")
router.register(r"polio/preparedness_dashboard", PreparednessDashboardViewSet, basename="preparedness_dashboard")
router.register(r"polio/imstats", IMStatsViewSet, basename="imstats")
router.register(r"polio/vaccines", VaccineStocksViewSet, basename="vaccines")
router.register(r"polio/forma", FormAStocksViewSet, basename="forma")
router.register(r"polio/v2/forma", FormAStocksViewSetV2, basename="forma")
router.register(r"polio/countryusersgroup", CountryUsersGroupViewSet, basename="countryusersgroup")
router.register(r"polio/orgunitspercampaign", OrgUnitsPerCampaignViewset, basename="orgunitspercampaign")
# duplicate of /api/configs. Can be removed once lqas OpenHexa pipeline switches to the main (iaso) endpoint
router.register(r"polio/configs", ConfigViewSet, basename="polioconfigs")
router.register(r"polio/datelogs", RoundDateHistoryEntryViewset, basename="datelogs")
router.register(r"polio/lqasim/countries", CountriesWithLqasIMConfigViewSet, basename="lqasimcountries")
router.register(r"polio/lqasmap/country", LQASCountryViewset, basename="lqascountry")
router.register(r"polio/lqasmap/global", LQASIMGlobalMapViewSet, basename="lqasmapglobal")
router.register(r"polio/lqasmap/zoomin", LQASIMZoominMapViewSet, basename="lqasmapzoomin")
router.register(r"polio/lqasmap/zoominbackground", LQASIMZoominMapBackgroundViewSet, basename="lqasmapzoominbackground")
router.register(r"polio/vaccineauthorizations", VaccineAuthorizationViewSet, basename="vaccine_authorizations")
router.register(r"polio/powerbirefresh", LaunchPowerBIRefreshViewSet, basename="powerbirefresh")
router.register(r"polio/rounds", RoundViewSet, basename="rounds")
router.register(r"polio/reasonsfordelay", ReasonForDelayViewSet, basename="reasonsfordelay")
router.register(r"polio/tasks/refreshlqas", RefreshLQASDataViewset, basename="refreshlqas")
router.register(r"polio/vaccine/request_forms", VaccineRequestFormViewSet, basename="vaccine_request_forms")
router.register(r"polio/vaccine/vaccine_stock", VaccineStockManagementViewSet, basename="vaccine_stocks")
router.register(
    r"polio/vaccine/stock/outgoing_stock_movement", OutgoingStockMovementViewSet, basename="outgoing_stock_movement"
)
router.register(r"polio/vaccine/stock/destruction_report", DestructionReportViewSet, basename="destruction_report")
router.register(r"polio/vaccine/stock/incident_report", IncidentReportViewSet, basename="incident_report")

router.register(r"polio/notifications", NotificationViewSet, basename="notifications")

router.register(r"tasks/create/refreshpreparedness", RefreshPreparednessLaucherViewSet, basename="refresh_preparedness")
router.register(
    r"polio/dashboards/vaccine_request_forms",
    VaccineRequestFormDashboardViewSet,
    basename="dashboard_vaccine_request_forms",
)
router.register(
    r"polio/dashboards/pre_alerts",
    PreAlertDashboardViewSet,
    basename="dashboard_pre-alerts",
)
router.register(
    r"polio/dashboards/arrival_reports",
    VaccineArrivalReportDashboardViewSet,
    basename="dashboard_arrival_reports",
)
router.register(
    r"polio/dashboards/rounds",
    RoundDashboardViewSet,
    basename="dashboard_rounds",
)
router.register(
    r"polio/dashboards/preparedness_sheets",
    SpreadSheetImportViewSet,
    basename="dashboard_preparedness_sheets",
)
