import csv

from django.core.paginator import Paginator
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.patient.duplicates import merge_patient_duplicate, ignore_patient_duplicate
from hat.patient.models import PatientDuplicatesPair
from .authentication import CsrfExemptSessionAuthentication


class PatientDuplicatesViewSet(viewsets.ViewSet):
    """
    Api to manage all potential patient duplicates, accept or reject a duplicate

    Listing possible duplicates

    Example:
        /api/patientduplicates/?algorithm=namesim&limit=50&page=1&full
        /api/patientduplicates/?algorithm=namesim&limit=50&page=1&csv
        /api/patientduplicates/?similarity=250&limit=50&page=1

    The allowed filters are:
    * algorithm: name of the algorithm that created the duplicates. By default, everything is returned
    * similarity: only return results that have a lower (better) or equal similarity score than the one specified.
                  Similarity scores range from 0 (exact match) to 1000 (worst match). Results over 700 are hardly ever
                  considered here.
    * full: when omitted, only the patient_id on each side is provided.
            When specified, the patient information is included.
    * csv: request an answer in a CSV file for mass verification. The CSV is always including the full information.

    To merge patient duplicates, just PUT the data on the duplicate id with the desired action.

    Examples:
        /api/patientduplicates/4356
        data: { merge: 123 } will keep the patient ID 123 from the duplicate 4356 and merge the other into 123.
        data: { ignore: true } will remove the duplicate from candidates and mark it to be ignored in the future.

    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_case_cases'
    ]

    def list(self, request):
        limit = int(request.GET.get("limit", 50))
        page_offset = int(request.GET.get("page", 1))

        orders = request.GET.get("order", "id").split(",")

        algorithm = request.GET.get("algorithm", None)
        similarity = request.GET.get("similarity", None)
        full = request.GET.get("full", None) is not None

        csvformat = request.GET.get("csv", None)  # default will be json

        queryset = (
            PatientDuplicatesPair.objects.order_by(*orders)
        )

        if algorithm:
            queryset = queryset.filter(algorithm=algorithm)

        if similarity:
            queryset = queryset.filter(similarity_score__lte=similarity)

        if csvformat is None:
            paginator = Paginator(queryset, limit)

            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["patientduplicatepairs"] = map(lambda x: x.as_dict(full), page.object_list)
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit

            return Response(res)
        else:
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="patientduplicatepairs.csv"'
            queryset = queryset.select_related('patient1', 'patient2')

            writer = csv.writer(response)
            writer.writerow(
                ['ID candidat duplicat', 'Score de similarité'
                 'ID patient 1', 'Prénom patient 1', 'Nom patient 1', 'Postnom patient 1', 'Nom de la maman',
                 'Année naissance patient 1',  # 'Détails patient 1',
                 'ID patient 2', 'Prénom patient 2', 'Nom patient 2', 'Postnom patient 2', 'Nom de la maman',
                 'Année naissance patient 2',  # 'Détails patient 2',
                 'Même patient ? (O/N)',
                 ])
            for dupe in queryset:
                writer.writerow([
                    dupe.id,
                    dupe.similarity_score,
                    dupe.patient1_id,
                    dupe.patient1.first_name,
                    dupe.patient1.last_name,
                    dupe.patient1.post_name,
                    dupe.patient1.mothers_surname,
                    dupe.patient1.year_of_birth,
                    # Compose patient 1 details URL,
                    dupe.patient2_id,
                    dupe.patient2.first_name,
                    dupe.patient2.last_name,
                    dupe.patient2.post_name,
                    dupe.patient2.mothers_surname,
                    dupe.patient2.year_of_birth,
                    # Compose patient 2 details URL,
                    ''
                ])

            return response

    def retrieve(self, request, pk=None):
        patient_dupe = get_object_or_404(PatientDuplicatesPair, pk=pk)
        return Response(patient_dupe.as_dict())

    def update(self, request, pk=None):
        patient_dupe = get_object_or_404(PatientDuplicatesPair, pk=pk)
        merge = request.data.get("merge", None)
        ignore = request.data.get("ignore", None)

        if merge:
            # Determine direction of merge p1=>p2 or p1<=p2
            if merge == patient_dupe.patient1_id:
                merge_to = patient_dupe.patient1
                merge_from = patient_dupe.patient2
            elif merge == patient_dupe.patient2_id:
                merge_to = patient_dupe.patient2
                merge_from = patient_dupe.patient1
            else:
                return Response("merge field should be the ID of either patient 1 or patient 2",
                                status=status.HTTP_400_BAD_REQUEST)

            result = merge_patient_duplicate(patient_dupe, merge_from, merge_to, request.user)

            return Response(result.as_dict(), status.HTTP_200_OK)

        if ignore:
            ignored_pair = ignore_patient_duplicate(patient_dupe)
            return Response(ignored_pair.as_dict(), status=status.HTTP_201_CREATED)
