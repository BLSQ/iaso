from datetime import timedelta
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.reverse import reverse

from hat.common.jsonschema_validator import DefaultValidator
from hat.metrics.models import DataPoint, Metric


class MetricsViewSet(viewsets.ViewSet):
    # View to list and retrieve registered metrics
    def list(self, request: Request) -> Response:
        items = []
        metrics = Metric.objects.order_by('abbreviation')
        for metric in metrics:
            items.append({
                'name': metric.name,
                'abbreviation': metric.abbreviation,
                'description': metric.description,
                'url': reverse('metrics-detail', args=[metric.abbreviation], request=request),
            })
        return Response(items)

    params_schema = {
        'type': 'object',
        'properties': {
            'date_from': {'type': 'string'},
            'date_to': {'type': 'string'},
        }
    }

    def retrieve(self, request: Request, pk: str) -> Response:
        params = request.GET
        metric = get_object_or_404(Metric, abbreviation=pk)
        DefaultValidator(MetricsViewSet.params_schema).validate(params)

        start_date = params.get("date_from", timezone.now() - timedelta(days=30))
        end_date = params.get("date_to", timezone.now())
        res = DataPoint.objects.filter(metric=metric) \
            .filter(timestamp__date__gte=start_date).filter(timestamp__date__lte=end_date) \
            .order_by('timestamp')
        return Response(res.values('id', 'value', 'timestamp'))


