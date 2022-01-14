from rest_framework import routers
from .views import views

from django.http import HttpResponse
from rest_framework import viewsets


class TestViewSet(viewsets.ViewSet):

    def list(self, request):
        return HttpResponse("Okay")


router = routers.SimpleRouter()
router.register(r"wfp/test", TestViewSet, basename="Test")
