import csv

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.response import Response
from hat.patient.models import Patient
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.core.paginator import Paginator
from django.db.models import Q



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

        village_ids = request.GET.get("village_id", None)
        province_ids = request.GET.get("province_id", None)
        zs_ids = request.GET.get("zs_id", None)
        as_ids = request.GET.get("as_id", None)
        teams = request.GET.get("teams", None)
        coordination_ids = request.GET.get("coordination_id", None)
        date_from = request.GET.get("date_from", None)
        date_to = request.GET.get("date_to", None)
        search_name = request.GET.get("search_name", None)
        search_prename = request.GET.get("search_prename", None)
        search_lastname = request.GET.get("search_lastname", None)
        search_mother_name = request.GET.get("search_mother_name", None)
        test_types = request.GET.get("test_type", None)

        csvformat = request.GET.get("csv", None)  # default will be json

        queryset = (
            Patient.objects.order_by(*orders)
        )

        # To-do: improve those queries
        if date_from:
            print ('Query on date_from:', date_from)
            # queryset = queryset.filter(case__test__date__gte=date_from).distinct()
        if date_to:
            print ('Query on date_to:', date_to)
            # queryset = queryset.filter(case__test__date__lte=date_to).distinct()
        if teams:
            print ('Query on test type:', teams)
            # queryset = queryset.filter(case__normalized_team_id__in=teams.split(",")).distinct()
        if coordination_ids:
            print ('Query on test type:', coordination_ids)
            # queryset = queryset.filter(case__normalized_team__coordination__id__in=coordination_ids.split(",")).distinct()

        if test_types:
            for test_type in test_types.split(","):
                print ('Query on test type:', test_type)
        #

        if province_ids and not zs_ids and not as_ids:
            queryset = queryset.filter(origin_area__ZS__province_id__in=province_ids.split(","))
        else:
            if zs_ids and not as_ids:
                queryset = queryset.filter(origin_area__ZS_id__in=zs_ids.split(","))
            else:
                if as_ids:
                    queryset = queryset.filter(origin_area_id__in=as_ids.split(","))

        if village_ids:
            queryset = queryset.filter(origin_village_id__in=village_ids.split(","))

        if search_name:
            queryset = queryset.filter(
                Q(post_name__icontains=search_name)
            )
        if search_prename:
            queryset = queryset.filter(
                Q(first_name__icontains=search_prename)
            )
        if search_lastname:
            queryset = queryset.filter(
                Q(last_name__icontains=search_lastname)
            )
        if search_mother_name:
            queryset = queryset.filter(
                Q(mothers_surname__icontains=search_mother_name)
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
            writer.writerow(
                ['Identifiant', 'UM', 'Année Formulaire', 'Source', 'Province encodée', 'ZS encodée', 'AS encodée',
                 'Village encodé', 'Nom', 'Prénom', 'Postnom', 'AS trouvée'])
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
