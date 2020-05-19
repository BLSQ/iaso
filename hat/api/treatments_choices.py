from rest_framework import viewsets
from rest_framework.response import Response
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from hat.patient.models import (MED_CHOICES, ISSUE_CHOICES,
                                INCOMPLETE_REASON_CHOICES, DEATH_MOMENT_CHOICES)


class TreatmentsChoicesViewSet(viewsets.ViewSet):
    """
    Api to list all statics choices available for a treatment
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = ["menupermissions.x_case_cases"]

    def list(self, request):
        return Response({
            "treatmentChoices": {
                "medChoices": MED_CHOICES,
                "issueChoices": ISSUE_CHOICES,
                "incompleteReasonsChoices": INCOMPLETE_REASON_CHOICES,
                "deathMomentChoices": DEATH_MOMENT_CHOICES
            },
        })
