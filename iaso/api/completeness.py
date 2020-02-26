from rest_framework import viewsets
from rest_framework.response import Response

from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication

response = {
    "fieldsKeys": [
        "ready",
        "errors",
        "exported"
    ],
    "data": [
        {
            "period": "2019Q1",
            "forms": [
                {
                    "id": "1234",
                    "label": "Formulaire test",
                    "months": [
                        {
                            "label": "january",
                            "id": 1,
                            "fields": {
                                "ready": 10,
                                "errors": 1,
                                "exported": 8
                            }
                        },
                        {
                            "label": "february",
                            "id": 2,
                            "fields": {
                                "ready": 15,
                                "errors": 3,
                                "exported": 11
                            }
                        },
                        {
                            "label": "march",
                            "id": 3,
                            "fields": {
                                "ready": 10,
                                "errors": 1,
                                "exported": 8
                            }
                        }
                    ]
                },
                {
                    "id": "12345",
                    "label": "Formulaire 2",
                    "months": [
                        {
                            "label": "january",
                            "id": 1,
                            "fields": {
                                "ready": 56,
                                "errors": 10,
                                "exported": 48
                            }
                        },
                        {
                            "label": "february",
                            "id": 2,
                            "fields": {
                                "ready": 19,
                                "errors": 5,
                                "exported": 11
                            }
                        },
                        {
                            "label": "march",
                            "id": 3,
                            "fields": {
                                "ready": 10,
                                "errors": 1,
                                "exported": 8
                            }
                        }
                    ]
                },
                {
                    "id": "123455",
                    "label": "Formulaire 3",
                    "months": [
                        {
                            "label": "january",
                            "id": 1,
                            "fields": {
                                "ready": 12,
                                "errors": 5,
                                "exported": 1
                            }
                        },
                        {
                            "label": "february",
                            "id": 2,
                            "fields": {
                                "ready": 125,
                                "errors": 20,
                                "exported": 100
                            }
                        },
                        {
                            "label": "march",
                            "id": 3,
                            "fields": {
                                "ready": 10,
                                "errors": 1,
                                "exported": 8
                            }
                        }
                    ]
                }
            ]
        },
        {
            "period": "2019Q2",
            "forms": [
                {
                    "id": "1234",
                    "label": "Formulaire test",
                    "months": [
                        {
                            "label": "april",
                            "id": 1,
                            "fields": {
                                "ready": 10,
                                "errors": 1,
                                "exported": 8
                            }
                        },
                        {
                            "label": "may",
                            "id": 2,
                            "fields": {
                                "ready": 15,
                                "errors": 3,
                                "exported": 11
                            }
                        },
                        {
                            "label": "june",
                            "id": 3,
                            "fields": {
                                "ready": 10,
                                "errors": 1,
                                "exported": 8
                            }
                        }
                    ]
                },
                {
                    "id": "12345",
                    "label": "Formulaire 2",
                    "months": [
                        {
                            "label": "april",
                            "id": 1,
                            "fields": {
                                "ready": 56,
                                "errors": 10,
                                "exported": 48
                            }
                        },
                        {
                            "label": "may",
                            "id": 2,
                            "fields": {
                                "ready": 19,
                                "errors": 5,
                                "exported": 11
                            }
                        },
                        {
                            "label": "june",
                            "id": 3,
                            "fields": {
                                "ready": 10,
                                "errors": 1,
                                "exported": 8
                            }
                        }
                    ]
                }
            ]
        }
    ]
}


class CompletenessViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
        return Response(
            {
                "completeness": response
            }
        )
