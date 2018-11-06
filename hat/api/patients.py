from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from hat.cases.models import Case
from hat.patient.models import Patient, Test, TestGroup
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.core.paginator import Paginator
from django.db.models import Q
import csv


class PatientsViewSet(viewsets.ViewSet):
    """
    Api to list all cases,  retrieve information about just one.

    Example:
        /api/patients/?limit=50&page=1&geo_search=zo

    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_locator'
    ]

    def list(self, request):
        limit = int(request.GET.get("limit", 50))
        page_offset = int(request.GET.get("page", 1))

        orders = request.GET.get("order", "id").split(",")

        province_ids = request.GET.get("province_id", None)
        zs_ids = request.GET.get("zs_id", None)
        as_ids = request.GET.get("as_id", None)
        years = request.GET.get("years", None)
        teams = request.GET.get("teams", None)
        date_from = request.GET.get("date_from", None)
        date_to = request.GET.get("date_to", None)

        csvformat = request.GET.get("csv", None) #default will be json

        queryset = (
            Patient.objects
            .order_by(*orders)
        )

        if csvformat is None:

            paginator = Paginator(queryset, limit)

            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["patient"] = map(lambda x: x.as_dict(), page.object_list)
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit

            return Response(res)
        else:
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="locatorcases.csv"'

            writer = csv.writer(response)
            writer.writerow(['Identifiant', 'UM', 'Année Formulaire', 'Source', 'Province encodée', 'ZS encodée', 'AS encodée', 'Village encodé', 'Nom', 'Prénom', 'Postnom', 'AS trouvée'])
            for case in queryset:
                cdict = case.as_dict()
                writer.writerow([
                    cdict["id"],
                    cdict["mobile_unit"],
                    cdict["form_year"],
                    cdict["source"],
                    cdict["province"],
                    cdict["ZS"],
                    cdict["AS"],
                    cdict["village"],
                    cdict["name"],
                    cdict["prename"],
                    cdict["lastname"],
                    cdict["normalized_AS_name"]
                ])
            return response

    def retrieve(self, request, pk=None):
        patient = get_object_or_404(Patient, pk=pk)
        return Response(patient.as_full_dict())

