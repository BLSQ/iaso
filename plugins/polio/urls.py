from rest_framework import routers

from .api.campaigns import CampaignViewSet
from .api.country_user_groups import CountryUsersGroupViewSet
from .api.polio_org_units import PolioOrgunitViewSet
from .budget.api import BudgetCampaignViewSet, BudgetStepViewSet, WorkflowViewSet

router = routers.SimpleRouter()
router.register(r"polio/orgunits", PolioOrgunitViewSet, basename="PolioOrgunit")
router.register(r"polio/campaigns", CampaignViewSet, basename="Campaign")
router.register(r"polio/budget", BudgetCampaignViewSet, basename="BudgetCampaign")
router.register(r"polio/budgetsteps", BudgetStepViewSet, basename="BudgetStep")
router.register(r"polio/workflow", WorkflowViewSet, basename="BudgetWorkflow")
router.register(r"polio/campaignsgroup", CampaignGroupViewSet, basename="campaigngroup")
router.register(r"polio/preparedness_dashboard", PreparednessDashboardViewSet, basename="preparedness_dashboard")
router.register(r"polio/imstats", IMStatsViewSet, basename="imstats")
router.register(r"polio/lqasstats", LQASStatsViewSet, basename="lqasstats")
router.register(r"polio/vaccines", VaccineStocksViewSet, basename="vaccines")
router.register(r"polio/forma", FormAStocksViewSet, basename="forma")
router.register(r"polio/v2/forma", FormAStocksViewSetV2, basename="forma")
router.register(r"polio/countryusersgroup", CountryUsersGroupViewSet, basename="countryusersgroup")
router.register(r"polio/linelistimport", LineListImportViewSet, basename="linelistimport")
router.register(r"polio/orgunitspercampaign", OrgUnitsPerCampaignViewset, basename="orgunitspercampaign")
router.register(r"polio/configs", ConfigViewSet, basename="polioconfigs")
router.register(r"polio/datelogs", RoundDateHistoryEntryViewset, basename="datelogs")
router.register(r"polio/lqasim/countries", CountriesWithLqasIMConfigViewSet, basename="lqasimcountries")
router.register(r"polio/lqasmap/global", LQASIMGlobalMapViewSet, basename="lqasmapglobal")
router.register(r"polio/lqasmap/zoomin", LQASIMZoominMapViewSet, basename="lqasmapzoomin")
router.register(r"polio/lqasmap/zoominbackground", LQASIMZoominMapBackgroundViewSet, basename="lqasmapzoominbackground")
router.register(r"polio/vaccineauthorizations", VaccineAuthorizationViewSet, basename="vaccine_authorizations")
router.register(r"polio/powerbirefresh", LaunchPowerBIRefreshViewSet, basename="powerbirefresh")
router.register(r"tasks/create/refreshpreparedness", RefreshPreparednessLaucherViewSet, basename="refresh_preparedness")
router.register(r"polio/rounds", RoundViewset, basename="rounds")
