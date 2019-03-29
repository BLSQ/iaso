from django.contrib.gis.geos import Point
from django.contrib.postgres.aggregates import ArrayAgg
from django.core.paginator import Paginator
from django.db.models import Q, OuterRef, Exists, Count
from django.http import HttpResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.cases.models import CaseView, Case, RES_POSITIVE
from hat.constants import TYPES_WITH_IMAGES, TYPES_WITH_VIDEOS
from hat.geo.models import AS, Village
from hat.patient.models import Patient, Test, PatientDuplicatesPair, Treatment
from hat.patient.utils import *
from hat.sync.models import DeviceDB
from hat.users.models import get_user_geo_list, is_authorized_user
from .authentication import CsrfExemptSessionAuthentication
from .export_utils import Echo, generate_xlsx, iter_items


class PatientsViewSet(viewsets.ViewSet):
    """
    Api to list all cases, retrieve information about just one.

    Example:
        /api/patients/?limit=50&page=1&geo_search=zo

    The allowed search fields are:
    village_id, province_id, zs_id, as_id: list of location ids to include in the search
    teams: list of teams to include. Only applies to normalized teams, not the mobile_unit text field
    coordination_id: list of coordinations to include
    date_from, date_to: date range for patient TESTS to consider
    search_name, search_prename, search_lastname, search_mother_name: patient search fields, partial & case insensitive
    test_type: list of test types to include
    screening_result, confirmation_result: include only patients having had this result
    only_dupes: only provide patients that have potential duplicates
    treatment_medicine: search patients that have had this medicine administered to them
    with_treatment: only include patient that have treatment information
    dead: if specified, only include patients with the corresponding death information. This is NOT looking at treatment
    data, only the patient status as reported in the app.

    csv_format: return data in CSV format. This will be streamed and therefore support large data sets
    xlsx_format: return data in MS Excel format. This will be fully generated server-side first and might timeout
    on large data sets.

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
        treatment_medicine = request.GET.get("treatment_medicine", None)
        with_treatment = request.GET.get("with_treatment", None)
        dead = request.GET.get("dead", None)
        tester_type = request.GET.get("tester_type", None)
        device_ids = request.GET.get("device_id", None)
        pictures = request.GET.get("pictures", None)
        videos = request.GET.get("videos", None)
        anonymous = request.user.has_perm("menupermissions.x_anonymous") and not request.user.is_superuser

        csv_format = request.GET.get("csv", None)  # default will be json
        xlsx_format = request.GET.get("xlsx", None)

        queryset = (
            Patient.objects.order_by(*orders)
        )
        additional_fields = []

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
            teams_cases = Case.objects\
                .filter(normalized_team_id__in=teams.split(","))\
                .filter(normalized_patient_id=OuterRef('id'))
            queryset = queryset\
                .annotate(teams_cases=Exists(teams_cases))\
                .filter(teams_cases=True)

        if coordination_id:
            coord_cases = Case.objects\
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
            confirmed_cases = Case.objects\
                .filter(confirmed_case=True)\
                .filter(normalized_patient_id=OuterRef('id'))
            queryset = queryset\
                .annotate(has_confirmed_case=Exists(confirmed_cases))\
                .filter(has_confirmed_case=(confirmation_result.lower() == 'true'))

        if treatment_medicine is not None:
            treatment_meds = Treatment.objects\
                .filter(medicine=treatment_medicine)\
                .filter(patient_id=OuterRef('id'))
            queryset = queryset\
                .annotate(has_treatment_med=Exists(treatment_meds))\
                .filter(has_treatment_med=True)

        queryset = queryset.annotate(treatment_count=Count("treatment"))
        additional_fields.append("treatment_count")
        if with_treatment is not None:
            queryset = queryset.filter(treatment_count__gt=0)

        if dead is not None:
            queryset = queryset.filter(dead=(dead.lower() == "true"))

        # Scope
        if request.user.profile.province_scope.count() != 0:
            queryset = queryset.filter(origin_area__ZS__province_id__in=get_user_geo_list(request.user, 'province_scope')).distinct()
        if request.user.profile.ZS_scope.count() != 0:
            queryset = queryset.filter(origin_area__ZS_id__in=get_user_geo_list(request.user, 'ZS_scope')).distinct()
        if request.user.profile.AS_scope.count() != 0:
            queryset = queryset.filter(origin_area_id__in=get_user_geo_list(request.user, 'AS_scope')).distinct()

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

        if tester_type:
            devices = DeviceDB.objects.filter(last_user__profile__tester_type__in=tester_type.split(',')).values_list('device_id', flat=True)
            cases = Case.objects.filter(device_id__in=devices).values_list('pk', flat=True)
            queryset = queryset.filter(case__in=cases)

        if device_ids:
            cases = Case.objects.filter(device_id__in=device_ids.split(",")).values_list('pk', flat=True)
            queryset = queryset.filter(case__in=cases)

        if pictures:
            picture_tests = Test.objects\
                .filter(form__normalized_patient_id=OuterRef("id")) \
                .filter(type__in=TYPES_WITH_IMAGES) \
                .filter(image_filename__isnull=False)

            if pictures == 'with_pictures':
                queryset = queryset.annotate(tests_with_pictures=Exists(picture_tests))\
                    .filter(tests_with_pictures=True)
            elif pictures == 'without_pictures':
                queryset = queryset.annotate(tests_with_pictures=Exists(picture_tests)) \
                    .filter(tests_with_pictures=False)
            elif pictures == 'with_pictures_uploaded':
                tests_with_uploaded_pictures = picture_tests\
                    .filter(image_id__isnull=False)
                queryset = queryset.annotate(tests_with_uploaded_pictures=Exists(tests_with_uploaded_pictures))\
                    .filter(tests_with_uploaded_pictures=True)
            elif pictures == 'without_pictures_uploaded':  # but with pictures:
                tests_without_uploaded_pictures = picture_tests\
                    .filter(image_id__isnull=True)
                queryset = queryset.annotate(tests_without_uploaded_pictures=Exists(tests_without_uploaded_pictures))\
                    .filter(tests_without_uploaded_pictures=True)

        if videos:
            has_videos = Test.objects\
                .filter(form__normalized_patient_id=OuterRef("id"))\
                .filter(type__in=TYPES_WITH_VIDEOS)\
                .filter(video_filename__isnull=False)

            if videos == 'with_videos':
                queryset = queryset.annotate(tests_with_videos=Exists(has_videos))\
                    .filter(tests_with_videos=True)
            elif videos == 'without_videos':
                queryset = queryset.annotate(tests_with_videos=Exists(has_videos)) \
                    .filter(tests_with_videos=False)
            elif videos == 'with_videos_uploaded':
                tests_with_videos = has_videos\
                    .filter(video_id__isnull=False)
                queryset = queryset.annotate(tests_with_videos=Exists(tests_with_videos))\
                    .filter(tests_with_videos=True)
            elif videos == 'without_videos_uploaded':  # but with videos:
                tests_without_videos = has_videos\
                    .filter(video_id__isnull=True)
                queryset = queryset.annotate(tests_without_videos=Exists(tests_without_videos))\
                    .filter(tests_without_videos=True)

        # Ignore the anonymous param here as the user might be entitled to use the filters but export anonymously
        if not (request.user.has_perm("menupermissions.x_anonymous") and not request.user.is_superuser):
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

        queryset_unprefetched = queryset
        # performance tweak for rendering of the patients
        queryset = queryset.prefetch_related("origin_area")
        queryset = queryset.prefetch_related("origin_area__ZS")
        queryset = queryset.prefetch_related("origin_area__ZS__province")
        queryset = queryset.prefetch_related("origin_village")
        # Already optimized for Count in additional_fields
        # queryset = queryset.prefetch_related("treatment_set")

        if csv_format is None and xlsx_format is None:
            paginator = Paginator(queryset, limit)

            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["patient"] = list(map(lambda x: x.as_dict(additional_fields=additional_fields), page.object_list))
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit

            return Response(res)
        else:

            filename = 'patients'
            if xlsx_format:
                filename = filename + '.xlsx'
                # avoid fetching those from get_row
                queryset = queryset.annotate(test_ids=ArrayAgg("case__test", distinct=True))
                queryset = queryset.annotate(treatment_ids=ArrayAgg("treatment", distinct=True))
                queryset_treatments = Treatment.objects\
                    .filter(patient__in=queryset_unprefetched)\
                    .order_by(*["patient_id", "index"])\
                    .select_related("device__last_user__profile__team")
                queryset_tests = Test.objects\
                    .filter(form__normalized_patient__in=queryset)\
                    .order_by("form__normalized_patient_id")\
                    .select_related("form")\
                    .select_related("village")\
                    .select_related("form__normalized_patient")\
                    .select_related("image")\
                    .select_related("video")

                response = HttpResponse(
                    generate_xlsx(
                        [
                            'Patients',
                            'Tests',
                            'Traitements',
                        ], [
                            columns,
                            columns_tests,
                            columns_treatments,
                        ], [
                            queryset,
                            queryset_tests,
                            queryset_treatments,
                        ], [
                            lambda row: get_row(row, anonymous),
                            lambda row: get_row_tests(row, request, anonymous),
                            lambda row: get_row_treatments(row, anonymous),
                        ],
                        column_sizes=[
                            columns_sizes,
                            columns_tests_sizes,
                            columns_treatments_sizes,
                        ]
                    ),
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
            if csv_format:
                filename = filename + '.csv'
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(queryset, Echo(), columns, get_row)),
                    content_type='text/csv',
                )
            response['Content-Disposition'] = 'attachment; filename=%s' % filename
            return response

    def retrieve(self, request, pk=None):
        patient = get_object_or_404(Patient, pk=pk)
        is_authorized = (not patient.origin_area) or is_authorized_user(request.user, patient.origin_area.ZS.province.id, patient.origin_area.ZS.id, patient.origin_area.id)
        if is_authorized:
            return Response(patient.as_full_dict())
        else:
            return Response('Unauthorized', status=401)

    def update(self, request, pk=None):
        new_patient = get_object_or_404(Patient, pk=pk)
        is_authorized = ((not new_patient.origin_area)
            or is_authorized_user(request.user, new_patient.origin_area.ZS.province.id, new_patient.origin_area.ZS.id, new_patient.origin_area.id))\
            and (request.user.has_perm("menupermissions.x_anonymous" and not request.user.is_superuser) or request.user.is_superuser)
        if is_authorized:
            new_patient.post_name = request.data.get('post_name', '')
            new_patient.last_name = request.data.get('last_name', '')
            new_patient.first_name = request.data.get('first_name', '')
            new_patient.sex = request.data.get('sex', '')
            year_of_birth = request.data.get('year_of_birth', None)
            new_patient.mothers_surname = request.data.get('mothers_surname', '')
            if year_of_birth:
                new_patient.year_of_birth = year_of_birth
            else:
                new_patient.year_of_birth = None

            AS_id = request.data.get('AS_id', None)
            if AS_id:
                new_AS = get_object_or_404(AS, pk=AS_id)
                new_patient.origin_area = new_AS
            else:
                new_patient.origin_area = None

            village_id = request.data.get('village_id', None)
            if village_id:
                new_village = get_object_or_404(Village, pk=village_id)
                new_patient.origin_village = new_village
            else:
                new_patient.origin_village = None

            death = request.data.get('death', None)
            if death:
                new_patient.dead = death.get('dead')
                if new_patient.dead:
                    new_patient.death_date = death.get('death_date')
                    device = death.get('device')
                    if device:
                        device_id = device.get('device_id')
                        device = get_object_or_404(DeviceDB, device_id=device_id)
                        new_patient.death_device = device
                    location = death.get('location')
                    if location:
                        new_patient.death_location = Point(x=location.get('coordinates')[0], y=location.get('coordinates')[1], srid=4326)
                else:
                    new_patient.death_date = None
                    new_patient.death_device = None
                    new_patient.death_location = None

            new_patient.save()
            return Response(new_patient.as_full_dict())
        else:
            return Response('Unauthorized', status=401)

