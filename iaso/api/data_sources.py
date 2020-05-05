from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import DataSource, OrgUnit


class DataSourceViewSet(viewsets.ViewSet):
    """
    list:
    """

    permission_classes = []
    permission_required = [
        "menupermissions.iaso_mappings",
        "menupermissions.iaso_org_units",
        "menupermissions.iaso_links",
    ]

    def list(self, request):
        linked_to = request.GET.get("linkedTo", None)
        sources = DataSource.objects.all()
        if not request.user.is_anonymous:
            profile = request.user.iaso_profile
            sources = sources.filter(projects__account=profile.account).distinct()

        if linked_to:
            org_unit = OrgUnit.objects.get(pk=linked_to)
            useful_sources = org_unit.source_set.values_list(
                "algorithm_run__version_2__data_source_id", flat=True
            )
            sources = sources.filter(id__in=useful_sources)
        return Response(
            {"sources": [source.as_dict() for source in sources.order_by("name")]}
        )
