# from rest_framework import routers
from rest_framework_nested import routers

from plugins.polio.api.campaigns.campaign_groups import CampaignGroupViewSet
from plugins.polio.api.campaigns.campaigns import CampaignViewSet
from plugins.polio.api.campaigns.orgunits_per_campaigns import OrgUnitsPerCampaignViewset
from plugins.polio.api.config import ConfigViewSet
from plugins.polio.api.country_user_groups import CountryUsersGroupViewSet
from plugins.polio.api.dashboards.forma import FormAStocksViewSet
from plugins.polio.api.dashboards.forma import FormAStocksViewSetV2
from plugins.polio.api.dashboards.launch_powerbi import LaunchPowerBIRefreshViewSet
from plugins.polio.api.dashboards.preparedness_dashboard import PreparednessDashboardViewSet
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
from plugins.polio.api.vaccines.supply_chain import VaccineRequestFormViewSet
from plugins.polio.api.vaccines.stock_management import VaccineStockManagementViewSet, OutgoingStockMovementViewSet

from plugins.polio.tasks.api.refresh_lqas_data import RefreshLQASDataViewset

router = routers.SimpleRouter()
router.register(r"api/polio/orgunits", PolioOrgunitViewSet, basename="PolioOrgunit")
router.register(r"api/polio/campaigns", CampaignViewSet, basename="Campaign")
router.register(r"api/polio/budget", BudgetCampaignViewSet, basename="BudgetCampaign")
router.register(r"api/polio/budgetsteps", BudgetStepViewSet, basename="BudgetStep")
router.register(r"api/polio/workflow", WorkflowViewSet, basename="BudgetWorkflow")
router.register(r"api/polio/campaignsgroup", CampaignGroupViewSet, basename="campaigngroup")
router.register(r"api/polio/preparedness_dashboard", PreparednessDashboardViewSet, basename="preparedness_dashboard")
router.register(r"api/polio/imstats", IMStatsViewSet, basename="imstats")
router.register(r"api/polio/vaccines", VaccineStocksViewSet, basename="vaccines")
router.register(r"api/polio/forma", FormAStocksViewSet, basename="forma")
router.register(r"api/polio/v2/forma", FormAStocksViewSetV2, basename="forma")
router.register(r"api/polio/countryusersgroup", CountryUsersGroupViewSet, basename="countryusersgroup")
router.register(r"api/polio/orgunitspercampaign", OrgUnitsPerCampaignViewset, basename="orgunitspercampaign")
router.register(r"api/polio/configs", ConfigViewSet, basename="polioconfigs")
router.register(r"api/polio/datelogs", RoundDateHistoryEntryViewset, basename="datelogs")
router.register(r"api/polio/lqasim/countries", CountriesWithLqasIMConfigViewSet, basename="lqasimcountries")
router.register(r"api/polio/lqasmap/country", LQASCountryViewset, basename="lqascountry")
router.register(r"api/polio/lqasmap/global", LQASIMGlobalMapViewSet, basename="lqasmapglobal")
router.register(r"api/polio/lqasmap/zoomin", LQASIMZoominMapViewSet, basename="lqasmapzoomin")
router.register(
    r"api/polio/lqasmap/zoominbackground", LQASIMZoominMapBackgroundViewSet, basename="lqasmapzoominbackground"
)
router.register(r"api/polio/vaccineauthorizations", VaccineAuthorizationViewSet, basename="vaccine_authorizations")
router.register(r"api/polio/powerbirefresh", LaunchPowerBIRefreshViewSet, basename="powerbirefresh")
router.register(r"api/polio/rounds", RoundViewSet, basename="rounds")
router.register(r"api/polio/reasonsfordelay", ReasonForDelayViewSet, basename="reasonsfordelay")
router.register(r"api/polio/tasks/refreshlqas", RefreshLQASDataViewset, basename="refreshlqas")
router.register(r"api/polio/vaccine/request_forms", VaccineRequestFormViewSet, basename="vaccine_request_forms")
router.register(r"api/polio/vaccine/vaccine_stock", VaccineStockManagementViewSet, basename="vaccine_stocks")
router.register(r"api/polio/notifications", NotificationViewSet, basename="notifications")

router.register(
    r"api/tasks/create/refreshpreparedness", RefreshPreparednessLaucherViewSet, basename="refresh_preparedness"
)

nested_router = routers.NestedSimpleRouter(router, r"api/polio/vaccine/vaccine_stock", lookup="vaccine_stock")
nested_router.register(
    r"outgoing_stock_movement",
    OutgoingStockMovementViewSet,
    basename="outgoing-stock-movement",
)
