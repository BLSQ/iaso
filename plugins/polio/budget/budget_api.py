from iaso.api.common import ModelViewSet, CSVExportMixin
from plugins.polio.budget.serializers import BudgetProcessForBudgetSerializer


class BudgetViewset(ModelViewSet, CSVExportMixin):
    """
    Campaign endpoint with budget information.

    You can request specific field by using the ?fields parameter
    """

    serializer_class = BudgetProcessForBudgetSerializer
