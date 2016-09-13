from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound

VISUZALIZATIONS = {
    "count_by_date": {
        "type": "vega-lite",
        "spec": {
            "mark": "bar",
            "encoding": {
                "y": {"field": "count", "type": "quantitative"},
                "x": {"field": "date", "type": "nominal"},
            }
        }
    },
    "single_value": {
        "type": "value"
    }
}


class VisualizationViewSet(viewsets.ViewSet):
    '''
    Viewset to list and retrieve visualization configs
    '''
    def list(self, request):
        r = [{'name': k, 'url': reverse('api:visualizations-detail', args=[k], request=request)}
             for k, _ in VISUZALIZATIONS.items()]
        return Response(r)

    def retrieve(self, request, pk=None):
        vis = VISUZALIZATIONS.get(pk, None)
        if vis is None:
            raise NotFound()
        return Response(vis)
