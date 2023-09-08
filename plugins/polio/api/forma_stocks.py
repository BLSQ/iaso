from rest_framework import viewsets
from plugins.polio.api.vaccine_stocks import handle_ona_request_with_key


class FormAStocksViewSet(viewsets.ViewSet):
    """
    Endpoint used to transform Vaccine Stocks data from existing ODK forms stored in ONA.
    sample config: [{"url": "https://afro.who.int/api/v1/data/yyy", "login": "d", "country": "hyrule", "password": "zeldarules", "country_id": 2115781}]
    """

    def list(self, request):
        return handle_ona_request_with_key(request, "forma")
