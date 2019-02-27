


from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from django.http import JsonResponse


class SitesViewSet(viewsets.ViewSet):

    permission_required = [
        'menupermissions.x_vectorcontrol'
    ]

    def list(self, request):
        return JsonResponse({
            "count": 2,
            "list": [
                {
                    "id": 1,
                    "name": "Site",
                    "created_at": "2019-02-26T11:41:01Z",
                    "creation_user": "cgerard",
                    "responsable": "madewulf",
                    "is_reference": True,
                    "ignore": False,
                    "latitude": 50.8267692,
                    "longitude": 4.3506015,
                    "altitude": 5.0,
                    "accuracy": 15.0,
                    "traps": [
                        {
                            "id": 1,
                            "name": "Piège",
                            "created_at": "2019-02-27T11:41:01Z",
                            "creation_user": "cgerard",
                            "latitude": 50.8297692,
                            "longitude": 4.3526015,
                            "altitude": 4.0,
                            "accuracy": 12.0,
                            "selected": True,
                        },
                        {
                            "id": 2,
                            "name": "Piège 2",
                            "created_at": "2019-02-27T12:01:01Z",
                            "creation_user": "cgerard",
                            "latitude": 50.8287692,
                            "longitude": 4.3516015,
                            "altitude": 5.0,
                            "accuracy": 15.0,
                            "selected": False,
                        }
                    ]
                },
                {
                    "id": 2,
                    "name": "Site2",
                    "created_at": "2019-02-26T11:41:01Z",
                    "creation_user": "madewulf",
                    "responsable": "cgerard",
                    "is_reference": True,
                    "ignore": False,
                    "latitude": 50.8297692,
                    "longitude": 4.3556015,
                    "altitude": 5.0,
                    "accuracy": 15.0,
                    "traps": [
                        {
                            "id": 3,
                            "name": "Piège 3",
                            "created_at": "2019-02-27T11:41:01Z",
                            "creation_user": "cgerard",
                            "latitude": 50.8297692,
                            "longitude": 4.3526015,
                            "altitude": 4.0,
                            "accuracy": 12.0,
                            "selected": True,
                        },
                        {
                            "id": 4,
                            "name": "Piège 4",
                            "created_at": "2019-02-27T12:01:01Z",
                            "creation_user": "cgerard",
                            "latitude": 50.8287692,
                            "longitude": 4.3516015,
                            "altitude": 5.0,
                            "accuracy": 15.0,
                            "selected": False,
                        }
                    ]
                }
            ],
            "has_next": False,
            "has_previous": False,
            "page": 1,
            "pages": 1,
            "limit": 50
        })
