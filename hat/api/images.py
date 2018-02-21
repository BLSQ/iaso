from rest_framework import viewsets
from rest_framework.response import Response
from hat.quality.models import Check
from hat.patient.models import Test
from django.db.models import Count
from django.db.models import F
import sys


class ImagesViewSet(viewsets.ViewSet):
    """
    """
    def list(self, request):
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        tests_with_images = Test.objects.annotate(num_images=Count('images')).filter(num_images__gt=0)\
            .annotate(num_checks=Count('check'))

        no_checks = tests_with_images.exclude(num_checks__gt=0)
        checks = tests_with_images.filter(num_checks__gt=0)

        mismatch = Check.objects.exclude(result=F('test__result'))

        return Response({
            'no_checks_count': no_checks.count(),
            'checks_count': checks.count(),
            'mismatch_count': mismatch.count()
        })

