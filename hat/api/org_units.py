from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import OrgUnit, Project
from hat.vector_control.models import APIImport
from django.contrib.gis.geos import Point
from .catches import timestamp_to_utc_datetime


class OrgUnitViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = []
    permission_classes = []

    def list(self, request):
        app_id = request.GET.get("app_id", "org.bluesquarehub.iaso")

        limit = request.GET.get("limit", None)
        validated = request.GET.get("validated", True)
        page_offset = request.GET.get("page", 1)
        order = request.GET.get("order", "id").split(",")

        if validated == "true":
            validated = True
        if validated == "false":
            validated = False

        queryset = (
            OrgUnit.objects.filter(validated=True)
            .exclude(org_unit_type=None)
            .filter(org_unit_type__projects__app_id=app_id)
            .order_by(*order)
        )

        if limit:
            limit = int(limit)
            page_offset = int(page_offset)

            paginator = Paginator(queryset, limit)
            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["orgunits"] = map(lambda x: x.as_dict(), page.object_list)
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit
            return Response(res)
        else:
            return Response({"orgUnits": [unit.as_dict() for unit in queryset]})

    def partial_update(self, request, pk=None):
        org_unit = get_object_or_404(OrgUnit, id=pk)
        org_unit.name = request.data.get("name", "")
        org_unit.short_name = request.data.get("short_name", "")
        org_unit.source = request.data.get("source", "")
        org_unit.validated = request.data.get("status", True)

        org_unit_type_id = request.data.get("org_unit_type_id", None)
        if org_unit_type_id:
            org_unit_type = get_object_or_404(OrgUnitType, id=org_unit_type_id)
            org_unit.org_unit_type = org_unit_type

        org_unit.save()

        return Response(org_unit.as_dict())

    def create(self, request):
        org_units = request.data

        new_org_units = []
        api_import = APIImport()
        if not request.user.is_anonymous:
            api_import.user = request.user
        api_import.import_type = "orgUnit"
        api_import.json_body = org_units
        api_import.save()
        try:
            for org_unit in org_units:
                uuid = org_unit.get("id", None)
                latitude = org_unit.get("latitude", None)
                longitude = org_unit.get("longitude", None)
                altitude = org_unit.get("altitude", 0)
                org_unit_location = None

                if latitude and longitude:
                    org_unit_location = Point(
                        x=longitude, y=latitude, z=altitude, srid=4326
                    )
                org_unit_db, created = OrgUnit.objects.get_or_create(uuid=uuid)

                if created:
                    org_unit_db.custom = True
                    org_unit_db.validated = False
                    org_unit_db.name = org_unit.get("name", None)
                    org_unit_db.accuracy = org_unit.get("accuracy", None)
                    org_unit_db.parent_id = org_unit.get("parentId", None)
                    org_unit_db.org_unit_type_id = org_unit.get("orgUnitTypeId", None)

                    t = org_unit.get("created_at", None)
                    if t:
                        org_unit_db.created_at = timestamp_to_utc_datetime(int(t))
                    else:
                        org_unit_db.created_at = org_unit.get("created_at", None)

                    t = org_unit.get("updated_at", None)
                    if t:
                        org_unit_db.updated_at = timestamp_to_utc_datetime(int(t))
                    else:
                        org_unit_db.updated_at = org_unit.get("created_at", None)

                    org_unit_db.creator = request.user
                    org_unit_db.source = "API"
                    org_unit_db.api_import = api_import
                    if org_unit_location:
                        org_unit_db.location = org_unit_location

                    new_org_units.append(org_unit_db)
                    org_unit_db.save()
                else:
                    print("not created")

            return Response([org_unit.as_dict() for org_unit in new_org_units])
        except:
            return Response({"res": "a problem happened, but your data was saved"})

    def retrieve(self, request, pk=None):
        org_unit = get_object_or_404(OrgUnit, pk=pk)
        res = org_unit.as_dict()
        return Response(res)
