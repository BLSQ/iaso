from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.geo.models import ZS
from hat.users.models import Team, Coordination
from hat.sync.models import ImageUpload
from hat.quality.models import Check
from hat.patient.models import Test
from django.db.models import Count


class ImagesViewSet(viewsets.ViewSet):
    """
    """
    def list(self, request):
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)

        tests_with_images_and_no_checks = Test.objects.annotate(num_images=Count('images')).annotate(num_checks=Count('check'))\
            .filter(num_images__gt=0).exclude(num_checks__gt=0)
        return Response("")

