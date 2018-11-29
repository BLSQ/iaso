import csv

from django.core.paginator import Paginator
from django.db.models import Q, OuterRef, Exists
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.cases.models import CaseView, RES_POSITIVE
from hat.patient.models import Patient, Test, PatientDuplicatesPair
from .authentication import CsrfExemptSessionAuthentication


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
        coordination_id = request.GET.get("coordination_id", None)
        date_from = request.GET.get("date_from", None)
        date_to = request.GET.get("date_to", None)
        search_name = request.GET.get("search_name", None)
        search_prename = request.GET.get("search_prename", None)
        search_lastname = request.GET.get("search_lastname", None)
        search_mother_name = request.GET.get("search_mother_name", None)
        test_types = request.GET.get("test_type", None)
        screening_result = request.GET.get("screening_result", None)
        confirmation_result = request.GET.get("confirmation_result", None)
        only_dupes = request.GET.get("only_dupes", None)

        csvformat = request.GET.get("csv", None)  # default will be json

        queryset = (
            Patient.objects.order_by(*orders)
        )

        if only_dupes:
            dupes = PatientDuplicatesPair.objects\
                .filter(Q(patient1_id=OuterRef('id')) | Q(patient2_id=OuterRef('id')))
            queryset = queryset\
                .annotate(has_dupes=Exists(dupes))\
                .filter(has_dupes=True)


        if date_from or date_to:
            test_with_date_in_range = Test.objects.filter(form__normalized_patient_id=OuterRef('id'))
            if date_from:
                test_with_date_in_range = test_with_date_in_range.filter(date__gte=date_from)
            if date_to:
                test_with_date_in_range = test_with_date_in_range.filter(date__lte=date_to)

            queryset = queryset\
                .annotate(test_with_date_in_range=Exists(test_with_date_in_range))\
                .filter(test_with_date_in_range=True)

        if teams:
            teams_cases = CaseView.objects\
                .filter(normalized_team_id__in=teams.split(","))\
                .filter(normalized_patient_id=OuterRef('id'))
            queryset = queryset\
                .annotate(teams_cases=Exists(teams_cases))\
                .filter(teams_cases=True)

        if coordination_id:
            coord_cases = CaseView.objects\
                .filter(normalized_team__coordination_id__in=coordination_id.split(","))\
                .filter(normalized_patient_id=OuterRef('id'))
            queryset = queryset\
                .annotate(teams_cases=Exists(coord_cases))\
                .filter(teams_cases=True)

        if test_types:
            test_with_type_in = Test.objects.filter(form__normalized_patient_id=OuterRef('id'))\
                .filter(type__in=test_types.upper().split(","))
            queryset = queryset \
                .annotate(test_with_type_in=Exists(test_with_type_in)) \
                .filter(test_with_type_in=True)

        if screening_result is not None:
            # setting this to false will provide patients that had no positive screening result at all
            positive_screening_cases = CaseView.objects\
                .filter(screening_result__gte=RES_POSITIVE)\
                .filter(normalized_patient_id=OuterRef('id'))
            queryset = queryset\
                .annotate(has_positive_screening_case=Exists(positive_screening_cases))\
                .filter(has_positive_screening_case=(screening_result.lower() == 'true'))

        if confirmation_result is not None:
            confirmed_cases = CaseView.objects\
                .filter(confirmed_case=True)\
                .filter(normalized_patient_id=OuterRef('id'))
            queryset = queryset\
                .annotate(has_confirmed_case=Exists(confirmed_cases))\
                .filter(has_confirmed_case=(confirmation_result.lower() == 'true'))

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
                Q(post_name__contains=search_name)
            )
        if search_prename:
            queryset = queryset.filter(
                Q(first_name__contains=search_prename)
            )
        if search_lastname:
            queryset = queryset.filter(
                Q(last_name__contains=search_lastname)
            )
        if search_mother_name:
            queryset = queryset.filter(
                Q(mothers_surname__contains=search_mother_name)
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
            response['Content-Disposition'] = 'attachment; filename="patients.csv"'

            writer = csv.writer(response)

            writer.writerow(['Identifiant', 'Nom', 'Postnom', 'Prénom', 'Sexe', 'Age', 'Nom de la mère', 'Province', 'Zone', 'Aire', 'Village'])
            for patient in queryset:
                pdict = patient.as_dict()

                writer.writerow([
                    pdict["id"],
                    pdict["last_name"],
                    pdict["post_name"],
                    pdict["first_name"],
                    pdict["sex"],
                    pdict["age"],
                    pdict["mothers_surname"],
                    pdict["province"],
                    pdict["ZS"],
                    pdict["AS"],
                    pdict["village"]
                ])
            return response

    def retrieve(self, request, pk=None):
        patient = get_object_or_404(Patient, pk=pk)
        return Response(patient.as_full_dict())
