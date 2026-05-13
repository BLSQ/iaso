from rest_framework import pagination
from rest_framework.response import Response


class FHIRPaginator(pagination.LimitOffsetPagination):
    default_limit = 20
    limit_query_param = "_count"
    limit_query_description = "Number of results to return per page."
    offset_query_param = "_skip"
    offset_query_description = "The initial index from which to return the results."
    max_limit = 100

    def get_paginated_response(self, data):
        base_url = self.request.build_absolute_uri().split("?")[0].rstrip("/")
        return Response(self.get_fhir_bundle(data, base_url=base_url))

    def get_fhir_bundle(self, data, bundle_id="search-results", base_url=None):
        if base_url is None:
            base_url = self.request.build_absolute_uri().split("?")[0].rstrip("/")

        links = [{"relation": "self", "url": self.request.build_absolute_uri()}]
        next_link = self.get_next_link()
        if next_link:
            links.append({"relation": "next", "url": next_link})
        prev_link = self.get_previous_link()
        if prev_link:
            links.append({"relation": "previous", "url": prev_link})

        entries = [
            {
                "resource": item,
                "fullUrl": f"{base_url}/{item['id']}",
            }
            for item in data
        ]

        return {
            "resourceType": "Bundle",
            "id": bundle_id,
            "meta": {"lastUpdated": "2024-01-01T00:00:00Z"},
            "type": "searchset",
            "total": self.count,
            "link": links,
            "entry": entries,
        }
