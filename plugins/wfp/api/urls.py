from rest_framework import routers

from plugins.wfp.api.beneficiaries.views import BeneficiaryViewSet


# router for DRF APIs
router = routers.SimpleRouter()
router.register(r"wfp/beneficiaries", BeneficiaryViewSet, basename="wfp_beneficiaries_api")
