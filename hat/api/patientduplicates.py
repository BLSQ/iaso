from django.core.paginator import Paginator
from django.db.models import OuterRef, Exists, Q
from django.http import HttpResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.cases.models import CaseView, RES_POSITIVE
from hat.common.utils import ANONYMOUS_PLACEHOLDER
from hat.patient.duplicates import merge_patient_duplicate, ignore_patient_duplicate
from hat.patient.models import PatientDuplicatesPair, Test, Patient
from hat.users.models import get_user_geo_list, is_authorized_user
from .authentication import CsrfExemptSessionAuthentication
from .export_utils import Echo, generate_xlsx, iter_items
from hat.audit.models import log_modification, PATIENT_API


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
        'menupermissions.x_duplicates'
    ]

    def list(self, request):
        limit = int(request.GET.get("limit", 50))
        page_offset = int(request.GET.get("page", 1))

        orders = request.GET.get("order", "id").split(",")

        algorithm = request.GET.get("algorithm", None)
        similarity = request.GET.get("similarity", None)
        full = request.GET.get("full", None) is not None

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
        patientId1 = request.GET.get("patientId1", None)
        patientId2 = request.GET.get("patientId2", None)

        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        anonymous = request.user.has_perm("menupermissions.x_anonymous") and not request.user.is_superuser

        queryset = (
            PatientDuplicatesPair.objects.all()
        )

        # conditions on the patient
        if not (request.user.has_perm("menupermissions.x_anonymous") and not request.user.is_superuser):
            if search_name:
                queryset = queryset.filter(
                    Q(patient1__post_name__contains=search_name) | Q(patient2__post_name__contains=search_name)
                )
            if search_prename:
                queryset = queryset.filter(
                    Q(patient1__first_name__contains=search_prename) | Q(patient2__first_name__contains=search_prename)
                )
            if search_lastname:
                queryset = queryset.filter(
                    Q(patient1__last_name__contains=search_lastname) | Q(patient2__last_name__contains=search_lastname)
                )
            if search_mother_name:
                queryset = queryset.filter(
                    Q(patient1__mothers_surname__contains=search_mother_name)
                    | Q(patient2__mothers_surname__contains=search_mother_name)
                )

        if request.user.profile.province_scope.count() != 0:
            user_province_list = get_user_geo_list(request.user, 'province_scope').distinct()
            queryset = queryset.filter(Q(patient1__origin_area__ZS__province_id__in=user_province_list)
                                       | Q(patient2__origin_area__ZS__province_id__in=user_province_list))
        if request.user.profile.ZS_scope.count() != 0:
            user_zs_list = get_user_geo_list(request.user, 'ZS_scope').distinct()
            queryset = queryset.filter(Q(patient1__origin_area__ZS_id__in=user_zs_list)
                                       | Q(patient2__origin_area__ZS_id__in=user_zs_list))
        if request.user.profile.AS_scope.count() != 0:
            user_as_list = get_user_geo_list(request.user, 'AS_scope').distinct()
            queryset = queryset.filter(Q(patient1__origin_area_id__in=user_as_list)
                                       | Q(patient2__origin_area_id__in=user_as_list))

        if province_ids and not zs_ids and not as_ids:
            queryset = queryset.filter(Q(patient1__origin_area__ZS__province_id__in=province_ids.split(","))
                                       | Q(patient2__origin_area__ZS__province_id__in=province_ids.split(",")))
        else:
            if zs_ids and not as_ids:
                queryset = queryset.filter(Q(patient1__origin_area__ZS_id__in=zs_ids.split(","))
                                           | Q(patient2__origin_area__ZS_id__in=zs_ids.split(",")))
            else:
                if as_ids:
                    queryset = queryset.filter(Q(patient1__origin_area_id__in=as_ids.split(","))
                                               | Q(patient2__origin_area_id__in=as_ids.split(",")))

        if village_ids:
            queryset = queryset.filter(Q(patient1__origin_village_id__in=village_ids.split(","))
                                       | Q(patient2__origin_village_id__in=village_ids.split(",")))

        # conditions on the Cases
        if coordination_id or teams:
            team_cases = CaseView.objects\
                .filter(Q(normalized_patient_id=OuterRef('patient1_id'))
                        | Q(normalized_patient_id=OuterRef('patient2_id')))
            if coordination_id:
                team_cases = team_cases.filter(normalized_team__coordination_id__in=coordination_id.split(","))
            if teams:
                team_cases = team_cases.filter(normalized_team_id__in=teams.split(","))
            queryset = queryset\
                .annotate(teams_cases=Exists(team_cases))\
                .filter(teams_cases=True)

        if screening_result is not None:
            if screening_result == 'not_done':
                none_screening_cases = CaseView.objects\
                    .filter(screening_result__isnull=True)\
                    .filter(Q(normalized_patient_id=OuterRef('patient1_id'))
                            | Q(normalized_patient_id=OuterRef('patient2_id')))
                queryset = queryset\
                    .annotate(has_none_screening_case=Exists(none_screening_cases))\
                    .filter(has_none_screening_case=True)
            else:
                # setting this to false will provide patients that had no positive screening result at all
                positive_screening_cases = CaseView.objects\
                    .filter(screening_result__gte=RES_POSITIVE)\
                    .filter(Q(normalized_patient_id=OuterRef('patient1_id'))
                            | Q(normalized_patient_id=OuterRef('patient2_id')))
                queryset = queryset\
                    .annotate(has_positive_screening_case=Exists(positive_screening_cases))\
                    .filter(has_positive_screening_case=(screening_result.lower() == 'true'))

        if confirmation_result is not None:
            if confirmation_result == 'not_done':
                none_confirmed_case = CaseView.objects\
                    .filter(confirmed_case__isnull=True)\
                    .filter(Q(normalized_patient_id=OuterRef('patient1_id'))
                            | Q(normalized_patient_id=OuterRef('patient2_id')))
                queryset = queryset\
                    .annotate(has_none_confirmed_case=Exists(none_confirmed_case))\
                    .filter(has_none_confirmed_case=True)
            else :
                confirmed_cases = CaseView.objects\
                    .filter(confirmed_case=True)\
                    .filter(Q(normalized_patient_id=OuterRef('patient1_id'))
                            | Q(normalized_patient_id=OuterRef('patient2_id')))
                queryset = queryset\
                    .annotate(has_confirmed_case=Exists(confirmed_cases))\
                    .filter(has_confirmed_case=(confirmation_result.lower() == 'true'))

        # conditions on the Tests
        if test_types:
            test_with_type_in = Test.objects.filter(Q(form__normalized_patient_id=OuterRef('patient1_id'))
                                                    | Q(form__normalized_patient_id=OuterRef('patient2_id')))\
                .filter(type__in=test_types.upper().split(","))
            queryset = queryset \
                .annotate(test_with_type_in=Exists(test_with_type_in)) \
                .filter(test_with_type_in=True)

        if date_from or date_to:
            test_with_date_in_range = Test.objects.filter(Q(form__normalized_patient_id=OuterRef('patient1_id'))
                                                    | Q(form__normalized_patient_id=OuterRef('patient2_id')))
            if date_from:
                test_with_date_in_range = test_with_date_in_range.filter(date__gte=date_from)
            if date_to:
                test_with_date_in_range = test_with_date_in_range.filter(date__lte=date_to)

            queryset = queryset\
                .annotate(test_with_date_in_range=Exists(test_with_date_in_range))\
                .filter(test_with_date_in_range=True)

        if algorithm:
            queryset = queryset.filter(algorithm=algorithm)

        if similarity:
            queryset = queryset.filter(similarity_score__lte=similarity)

        if patientId1 and patientId2:
            queryset = queryset.filter((Q(patient1_id=patientId1) & Q(patient2_id=patientId2))
                                        | (Q(patient1_id=patientId2) & Q(patient2_id=patientId1)))

        # When fully rendering, prefetch subobjects for performance
        if full:
            queryset = queryset.prefetch_related("patient1")
            queryset = queryset.prefetch_related("patient2")
            queryset = queryset.prefetch_related("patient1__origin_area")
            queryset = queryset.prefetch_related("patient1__origin_area__ZS")
            queryset = queryset.prefetch_related("patient1__origin_area__ZS__province")
            queryset = queryset.prefetch_related("patient1__origin_village")
            queryset = queryset.prefetch_related("patient2__origin_area")
            queryset = queryset.prefetch_related("patient2__origin_area__ZS")
            queryset = queryset.prefetch_related("patient2__origin_area__ZS__province")
            queryset = queryset.prefetch_related("patient2__origin_village")

        if csv_format is None and xlsx_format is None:
            res = {"count": queryset.count()}
            queryset = queryset.order_by(*orders)
            paginator = Paginator(queryset, limit)

            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["patientduplicatepairs"] = list(map(lambda x: x.as_dict(full), page.object_list))
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit

            return Response(res)
        else:
            if (not request.user.has_perm("menupermissions.x_datas_download") and not request.user.is_superuser):
                return Response('Unauthorized', status=401)
            columns = [
                {"title": "ID candidat\nduplicat",      "width": 10},
                {"title": "Score de\nsimilarité",       "width": 8},
                {"title": "Patient 1\nID",              "width": 10},
                {"title": "Patient 1\nPrénom",          "width": 15},
                {"title": "Patient 1\nNom",             "width": 15},
                {"title": "Patient 1\nPostnom",         "width": 15},
                {"title": "Patient 1\nNom de la maman", "width": 15},
                {"title": "Patient 1\nAnnée naissance", "width": 8},
                {"title": "Patient 1\nAS",              "width": 15},
                {"title": "Patient 1\nVillage",         "width": 18},
                {"title": "Patient 2\nID",              "width": 10},
                {"title": "Patient 2\nPrénom",          "width": 15},
                {"title": "Patient 2\nNom",             "width": 15},
                {"title": "Patient 2\nPostnom",         "width": 15},
                {"title": "Patient 2\nNom de la maman", "width": 15},
                {"title": "Patient 2\nAnnée naissance", "width": 8},
                {"title": "Patient 2\nAS",              "width": 15},
                {"title": "Patient 2\nVillage",         "width": 15},
                {"title": "Même patient?\n(O/N)",       "width": 8},
            ]

            filename = 'patientduplicatepairs'
            limited_queryset = queryset.values(
                "id",
                "similarity_score",
                "patient1_id",
                "patient1__first_name",
                "patient1__last_name",
                "patient1__post_name",
                "patient1__mothers_surname",
                "patient1__year_of_birth",
                "patient1__origin_area__name",
                "patient1__origin_raw_AS",
                "patient1__origin_village__name",
                "patient1__origin_raw_village",
                "patient2_id",
                "patient2__first_name",
                "patient2__last_name",
                "patient2__post_name",
                "patient2__mothers_surname",
                "patient2__year_of_birth",
                "patient2__origin_area__name",
                "patient2__origin_raw_AS",
                "patient2__origin_village__name",
                "patient2__origin_raw_village",
            )

            def get_row(dupe, **kwargs):
                return [
                        dupe['id'],
                        dupe['similarity_score'],
                        dupe['patient1_id'],
                        dupe['patient1__first_name'] if not anonymous else ANONYMOUS_PLACEHOLDER,
                        dupe['patient1__last_name'] if not anonymous else ANONYMOUS_PLACEHOLDER,
                        dupe['patient1__post_name'] if not anonymous else ANONYMOUS_PLACEHOLDER,
                        dupe['patient1__mothers_surname'] if not anonymous else ANONYMOUS_PLACEHOLDER,
                        dupe['patient1__year_of_birth'],
                        dupe['patient1__origin_area__name']
                        if dupe['patient1__origin_area__name'] else dupe['patient1__origin_raw_AS'],
                        dupe['patient1__origin_village__name']
                        if dupe['patient1__origin_village__name'] else dupe['patient1__origin_raw_village'],
                        dupe['patient2_id'],
                        dupe['patient2__first_name'] if not anonymous else ANONYMOUS_PLACEHOLDER,
                        dupe['patient2__last_name'] if not anonymous else ANONYMOUS_PLACEHOLDER,
                        dupe['patient2__post_name'] if not anonymous else ANONYMOUS_PLACEHOLDER,
                        dupe['patient2__mothers_surname'] if not anonymous else ANONYMOUS_PLACEHOLDER,
                        dupe['patient2__year_of_birth'],
                        dupe['patient2__origin_area__name']
                        if dupe['patient1__origin_area__name'] else dupe['patient1__origin_raw_AS'],
                        dupe['patient2__origin_village__name']
                        if dupe['patient1__origin_village__name'] else dupe['patient1__origin_raw_village'],
                        ''
                    ]

            if xlsx_format:
                filename = filename + '.xlsx'
                response = HttpResponse(
                    generate_xlsx('Doublons', columns, limited_queryset, get_row),
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
            if csv_format:
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(limited_queryset, Echo(), columns, get_row)),
                    content_type='text/csv',
                )
                filename = filename + '.csv'
            response['Content-Disposition'] = 'attachment; filename=%s' % filename
            return response

    def retrieve(self, request, pk=None):
        patient_dupe = get_object_or_404(PatientDuplicatesPair, pk=pk)
        is_authorized = (
                                (not patient_dupe.patient1.origin_area)
                                or is_authorized_user(request.user,
                                                      patient_dupe.patient1.origin_area.ZS.province.id,
                                                      patient_dupe.patient1.origin_area.ZS.id,
                                                      patient_dupe.patient1.origin_area.id)
                        ) and (
                                (not patient_dupe.patient2.origin_area)
                                or is_authorized_user(request.user,
                                                      patient_dupe.patient2.origin_area.ZS.province.id,
                                                      patient_dupe.patient2.origin_area.ZS.id,
                                                      patient_dupe.patient2.origin_area.id)
                        )
        if is_authorized:
            return Response(patient_dupe.as_dict())
        else:
            return Response('Unauthorized', status=401)

    def update(self, request, pk=None):
        patient_dupe = get_object_or_404(PatientDuplicatesPair, pk=pk)
        is_authorized = (
                                (not patient_dupe.patient1.origin_area)
                                or is_authorized_user(request.user,
                                                      patient_dupe.patient1.origin_area.ZS.province.id,
                                                      patient_dupe.patient1.origin_area.ZS.id,
                                                      patient_dupe.patient1.origin_area.id)
                        ) and (
                                (not patient_dupe.patient2.origin_area)
                                or is_authorized_user(request.user,
                                                      patient_dupe.patient2.origin_area.ZS.province.id,
                                                      patient_dupe.patient2.origin_area.ZS.id,
                                                      patient_dupe.patient2.origin_area.id)
                        )
        if is_authorized:
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
                ignored_pair = ignore_patient_duplicate(patient_dupe, request.user)
                return Response(ignored_pair.as_dict(), status=status.HTTP_201_CREATED)
        else:
            return Response('Unauthorized', status=401)

    def create(self, request):
        #  check rights to save it
        patientA = request.data.get('patientA', None)
        patientB = request.data.get('patientB', None)

        newPatientDuplicatesPair = PatientDuplicatesPair()
        if patientA and patientB:
            patient1 = get_object_or_404(Patient, pk=patientA["id"])
            patient2 = get_object_or_404(Patient, pk=patientB["id"])
            is_authorized = (
                                    (not patient1.origin_area)
                                    or is_authorized_user(request.user,
                                                        patient1.origin_area.ZS.province.id,
                                                        patient1.origin_area.ZS.id,
                                                        patient1.origin_area.id)
                            ) and (
                                    (not patient2.origin_area)
                                    or is_authorized_user(request.user,
                                                        patient2.origin_area.ZS.province.id,
                                                        patient2.origin_area.ZS.id,
                                                        patient2.origin_area.id)
                            )
            if is_authorized:
                newPatientDuplicatesPair.patient1 = patient1
                newPatientDuplicatesPair.patient2 = patient2
                newPatientDuplicatesPair.similarity_score = 0
                newPatientDuplicatesPair.algorithm = "manual"
                newPatientDuplicatesPair.save()
                log_modification(None, newPatientDuplicatesPair, PATIENT_API, request.user)
                return Response(newPatientDuplicatesPair.as_dict())
            else:
                return Response('Unauthorized', status=401)

        return Response('One patient is missing', status=500)

