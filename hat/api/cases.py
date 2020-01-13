from datetime import datetime, timedelta
from django.utils import dateparse
from copy import copy
import uuid

from django.core.paginator import Paginator

from django.db import transaction
from django.db.models import Q, OuterRef, Exists
from django.http import StreamingHttpResponse, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.audit.models import log_modification, CASE_API
from hat.cases.models import CaseView, Case, RES_POSITIVE, testResultString
from hat.common.utils import ANONYMOUS_PLACEHOLDER
from hat.constants import TYPES_WITH_VIDEOS, TYPES_WITH_IMAGES, DATE_FORMAT
from hat.geo.models import Village
from hat.patient.models import Test, Patient
from hat.sync.models import DeviceDB
from hat.users.models import (
    get_user_geo_list,
    is_authorized_user,
    SCREENING_TYPE_CHOICES,
    Team,
)
from .authentication import CsrfExemptSessionAuthentication
from .export_utils import Echo, generate_xlsx, iter_items
from ..import_export.utils import create_documentid, hat_id


class CasesViewSet(viewsets.ViewSet):
    """
    Api to list all records (cases),  retrieve information about just one.
    Allowed search criteria:
    - province_id
    - zs_id
    - as_id
    - years
    - teams
    - from
    - to
    - geo_search
    - normalized
    - csv: return data in CSV format rather than JSON. Intended for download
    - located: show already located cases
    - screening_result: result of the most significant screening test
    - confirmation_result: result of the most significant confirmation test
    - source: pv, historic, mobile_sync, mobile_backup
    - search: substring search in first/last/post-name
    - coordination: coordination ID

    Example:
        /api/cases/?limit=50&page=1&geo_search=zo

    To retrieve aall details on a specific record (case):
        GET /api/cases/12345?full
    All information related to the record will be returned with normalized location, patient, tests, device...
    Note that 12345 is the ID of the record, not the document_id or hat_id
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = ["menupermissions.x_locator", "menupermissions.x_case_cases"]

    def list(self, request):
        limit = int(request.GET.get("limit", 50))
        page_offset = int(request.GET.get("page", 1))

        orders = request.GET.get("order", "ZS").split(",")

        province_ids = request.GET.get("province_id", None)
        zs_ids = request.GET.get("zs_id", None)
        as_ids = request.GET.get("as_id", None)
        village_ids = request.GET.get("village_id", None)
        years = request.GET.get("years", None)
        teams = request.GET.get("teams", None)
        anonymous_request = request.GET.get("anonymous", None)
        stage = request.GET.get("stage", None)
        coordination_ids = request.GET.get("coordination_id", None)
        from_date = request.GET.get("date_from", None)
        to_date = request.GET.get("date_to", None)
        geo_search = request.GET.get("geo_search", None)
        normalized = request.GET.get("normalized", None)
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        located = request.GET.get("located", "all")
        screening_result = request.GET.get("screening_result", None)
        confirmation_result = request.GET.get("confirmation_result", None)
        source = request.GET.get("source", None)
        search_name = request.GET.get("search_name", None)
        search_prename = request.GET.get("search_prename", None)
        search_lastname = request.GET.get("search_lastname", None)
        search_mother_name = request.GET.get("search_mother_name", None)
        coordination = request.GET.get("coordination", None)
        is_locator = request.GET.get("isLocator", None)
        test_types = request.GET.get("test_type", None)
        tester_type = request.GET.get("tester_type", None)
        screening_type = request.GET.get("screening_type", None)
        device_ids = request.GET.get("device_id", None)
        pictures = request.GET.get("pictures", None)
        videos = request.GET.get("videos", None)
        show_deleted = request.GET.get("showDeleted", None)
        show_undeleted = request.GET.get("showUnDeleted", None)

        anonymous = (
            request.user.has_perm("menupermissions.x_anonymous")
            and not request.user.is_superuser
        ) or anonymous_request
        if located not in [
            "all",
            "only_not_located",
            "only_not_located_and_not_found",
            "only_located",
        ]:
            return Response(
                "Invalid located parameter", status=status.HTTP_400_BAD_REQUEST
            )

        if located == "all":
            queryset = Case.objects.order_by(*orders)

        if is_locator == "true":
            queryset = (
                Case.objects.filter(confirmed_case=True)
                .exclude(source="mobile_sync")
                .exclude(source="mobile_backup")
                .exclude(province__icontains="kas")
                .exclude(province__icontains="kinsh")
                .exclude(province__icontains="bas")
                .exclude(province__icontains="maniema")
                .exclude(province__icontains="k.")
                .exclude(province__icontains="equateur")
                .exclude(Q(form_year=None) & Q(mobile_unit=None) & Q(form_number=None))
                .order_by(*orders)
            )

        if located == "only_not_located":
            queryset = Case.objects.filter(
                normalized_village=None, normalized_village_not_found=False
            ).order_by(*orders)

        if located == "only_not_located_and_not_found":
            queryset = Case.objects.filter(
                normalized_village=None, normalized_village_not_found=True
            ).order_by(*orders)

        if located == "only_located":
            queryset = Case.objects.filter(normalized_village__isnull=False).order_by(
                *orders
            )

        if stage is not None:
            queryset = Case.objects.filter(test_pl_result=stage)

        queryset = CaseView.add_caseview_fields_to_case_queryset(queryset)

        if show_undeleted is not None and show_deleted is None:
            queryset = queryset.filter(mark_for_deletion=False)

        if show_deleted is not None and show_undeleted is None:
            queryset = queryset.filter(mark_for_deletion=True)

        if located != "all" and is_locator != "true":
            queryset = (
                queryset.exclude(source="mobile_sync")
                .exclude(source="mobile_backup")
                .exclude(province__icontains="kas")
                .exclude(province__icontains="kinsh")
                .exclude(province__icontains="bas")
                .exclude(province__icontains="maniema")
                .exclude(province__icontains="k.")
                .exclude(province__icontains="equateur")
            )

        if coordination_ids:
            queryset = queryset.filter(
                normalized_team__coordination__id__in=coordination_ids.split(",")
            )

        if request.user.profile.province_scope.count() != 0:
            queryset = queryset.filter(
                normalized_AS__ZS__province_id__in=get_user_geo_list(
                    request.user, "province_scope"
                )
            ).distinct()
        if request.user.profile.ZS_scope.count() != 0:
            queryset = queryset.filter(
                normalized_AS__ZS_id__in=get_user_geo_list(request.user, "ZS_scope")
            ).distinct()
        if request.user.profile.AS_scope.count() != 0:
            queryset = queryset.filter(
                normalized_AS_id__in=get_user_geo_list(request.user, "AS_scope")
            ).distinct()

        if province_ids and not zs_ids and not as_ids:
            queryset = queryset.filter(
                normalized_AS__ZS__province_id__in=province_ids.split(",")
            )
        else:
            if zs_ids and not as_ids:
                queryset = queryset.filter(normalized_AS__ZS_id__in=zs_ids.split(","))
            else:
                if as_ids:
                    queryset = queryset.filter(normalized_AS_id__in=as_ids.split(","))

        if village_ids:
            queryset = queryset.filter(normalized_village_id__in=village_ids.split(","))
        if years:
            queryset = queryset.filter(normalized_year__in=years.split(","))
        if teams:
            queryset = queryset.filter(normalized_team_id__in=teams.split(","))
        if from_date:
            queryset = queryset.filter(
                Q(normalized_date__gte=from_date)
                | (Q(normalized_date__isnull=True) & Q(form_year__gte=from_date[:4]))
            )
        if to_date:
            queryset = queryset.filter(
                Q(
                    normalized_date__lte=datetime.strptime(to_date, DATE_FORMAT)
                    + timedelta(days=1)
                )
                | (Q(normalized_date__isnull=True) & Q(form_year__lte=to_date[:4]))
            )

        if source:
            queryset = queryset.filter(source=source)
        if not (
            request.user.has_perm("menupermissions.x_anonymous")
            and not request.user.is_superuser
        ):
            if search_name:
                queryset = queryset.filter(Q(name__icontains=search_name))
            if search_prename:
                queryset = queryset.filter(Q(prename__icontains=search_prename))
            if search_lastname:
                queryset = queryset.filter(Q(lastname__icontains=search_lastname))
            if search_mother_name:
                queryset = queryset.filter(
                    Q(mothers_surname__icontains=search_mother_name)
                )

        if screening_result is not None:
            if screening_result == "true":
                queryset = queryset.filter(screening_result__gte=RES_POSITIVE)
            elif screening_result == "false":
                queryset = queryset.filter(screening_result__lt=RES_POSITIVE)
            elif screening_result == "not_done":
                queryset = queryset.filter(screening_result__isnull=True)
        if confirmation_result is not None:
            if confirmation_result == "true":
                queryset = queryset.filter(confirmation_result__gte=RES_POSITIVE)
            elif confirmation_result == "false":
                queryset = queryset.filter(confirmation_result__lt=RES_POSITIVE)
            elif confirmation_result == "not_done":
                queryset = queryset.filter(confirmation_result__isnull=True)

        if normalized is not None:
            if normalized != "true":
                queryset = queryset.filter(normalized_AS__isnull=True)
            else:
                queryset = queryset.exclude(normalized_AS__isnull=True)

        if coordination:
            queryset = queryset.filter(normalized_team__coordination_id=coordination)

        if geo_search:
            queryset = queryset.filter(
                Q(village__icontains=geo_search)
                | Q(ZS__icontains=geo_search)
                | Q(AS__icontains=geo_search)
            )

        if test_types:
            for test_type in test_types.split(","):
                if test_type == "CATT":
                    queryset = queryset.filter(test_catt__isnull=False)
                if test_type == "RDT":
                    queryset = queryset.filter(test_rdt__isnull=False)
                if test_type == "CTCWOO":
                    queryset = queryset.filter(test_ctcwoo__isnull=False)
                if test_type == "GE":
                    queryset = queryset.filter(test_ge__isnull=False)
                if test_type == "LCR":
                    queryset = queryset.filter(test_lcr__isnull=False)
                if test_type == "LNP":
                    queryset = queryset.filter(test_lymph_node_puncture__isnull=False)
                if test_type == "SF":
                    queryset = queryset.filter(test_sf__isnull=False)
                if test_type == "PG":
                    queryset = queryset.filter(test_pg__isnull=False)
                if test_type == "MAECT":
                    queryset = queryset.filter(test_maect__isnull=False)
                if test_type == "PL":
                    queryset = queryset.filter(test_pl__isnull=False)
                if test_type == "research_pl":
                    queryset = queryset.filter(test_research_pl__isnull=False)
                if test_type == "clinicalsigns":
                    queryset = queryset.filter(test_clinicalsigns__isnull=False)

        if tester_type:
            devices = DeviceDB.objects.filter(
                last_user__profile__tester_type__in=tester_type.split(",")
            ).values_list("device_id", flat=True)
            queryset = queryset.filter(device_id__in=devices)

        if screening_type:
            if screening_type not in [x[0] for x in SCREENING_TYPE_CHOICES]:
                return Response(
                    f"Invalid screening_type, should be {SCREENING_TYPE_CHOICES}",
                    status=status.HTTP_400_BAD_REQUEST,
                )
            queryset = queryset.filter(screening_type=screening_type)

        if device_ids:
            queryset = queryset.filter(device_id__in=device_ids.split(","))

        if pictures:
            has_pictures = (
                Test.objects.filter(form_id=OuterRef("id"))
                .filter(type__in=TYPES_WITH_IMAGES)
                .filter(image_filename__isnull=False)
            )
            if pictures == "with_pictures":
                queryset = queryset.annotate(has_pictures=Exists(has_pictures)).filter(
                    has_pictures=True
                )
            elif pictures == "without_pictures":
                queryset = queryset.annotate(has_pictures=Exists(has_pictures)).filter(
                    has_pictures=False
                )
            elif pictures == "with_pictures_uploaded":
                has_uploaded_pictures = has_pictures.filter(image_id__isnull=False)
                queryset = queryset.annotate(
                    has_uploaded_pictures=Exists(has_uploaded_pictures)
                ).filter(has_uploaded_pictures=True)
            elif pictures == "without_pictures_uploaded":  # but with pictures:
                has_uploaded_pictures = has_pictures.filter(image_id__isnull=True)
                queryset = queryset.annotate(
                    has_uploaded_pictures=Exists(has_uploaded_pictures)
                ).filter(has_uploaded_pictures=True)

        if videos:
            has_videos = (
                Test.objects.filter(form_id=OuterRef("id"))
                .filter(type__in=TYPES_WITH_VIDEOS)
                .filter(video_filename__isnull=False)
            )
            if videos == "with_videos":
                queryset = queryset.annotate(has_videos=Exists(has_videos)).filter(
                    has_videos=True
                )
            elif videos == "without_videos":
                queryset = queryset.annotate(has_videos=Exists(has_videos)).filter(
                    has_videos=False
                )
            elif videos == "with_videos_uploaded":
                has_uploaded_videos = has_videos.filter(video_id__isnull=False)
                queryset = queryset.annotate(
                    has_uploaded_videos=Exists(has_uploaded_videos)
                ).filter(has_uploaded_videos=True)
            elif videos == "without_videos_uploaded":  # but with videos:
                has_unuploaded_videos = has_videos.filter(video_id__isnull=True)
                queryset = queryset.annotate(
                    has_unuploaded_videos=Exists(has_unuploaded_videos)
                ).filter(has_unuploaded_videos=True)

        queryset = CaseView.add_caseview_fields_to_case_queryset(queryset)

        # Performance prefetch
        queryset = queryset.prefetch_related("normalized_AS")
        queryset = queryset.prefetch_related("normalized_AS__ZS")
        queryset = queryset.prefetch_related("normalized_AS__ZS__province")
        queryset = queryset.prefetch_related("normalized_village")
        queryset = queryset.prefetch_related("normalized_village__AS")
        queryset = queryset.prefetch_related("normalized_village__AS__ZS")
        queryset = queryset.prefetch_related("normalized_village__AS__ZS__province")
        queryset = queryset.prefetch_related("normalized_patient")
        queryset = queryset.prefetch_related("normalized_patient__origin_area")
        queryset = queryset.prefetch_related("normalized_patient__origin_area__ZS")
        queryset = queryset.prefetch_related(
            "normalized_patient__origin_area__ZS__province"
        )
        queryset = queryset.prefetch_related("normalized_patient__origin_village")
        queryset = queryset.prefetch_related("normalized_team")
        queryset = queryset.prefetch_related("infection_location")
        queryset = queryset.prefetch_related("infection_location__AS")
        queryset = queryset.prefetch_related("infection_location__AS__ZS")

        if csv_format is None and xlsx_format is None:

            paginator = Paginator(queryset, limit)

            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["cases"] = list(
                map(
                    lambda x: x.as_dict(
                        additional_fields=CaseView.caseview_additional_fields
                    ),
                    page.object_list,
                )
            )  # just the map breaks the tests
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit

            return Response(res)
        else:
            if (
                not request.user.has_perm("menupermissions.x_datas_download")
                and not request.user.is_superuser
            ):
                return Response("Unauthorized", status=401)
            columns = [
                {"title": "Identifiant", "width": 9},
                {"title": "UM", "width": 14},
                {"title": "Date", "width": 15},
                {"title": "Source", "width": 10},
                {"title": "Province encodée", "width": 10},
                {"title": "ZS encodée", "width": 14},
                {"title": "AS encodée", "width": 14},
                {"title": "Village encodé", "width": 20},
                {"title": "Nom", "width": 18},
                {"title": "Postnom", "width": 18},
                {"title": "Prénom", "width": 18},
                {"title": "Nom de\nla mère", "width": 15},
                {"title": "Sexe", "width": 6},
                {"title": "Age", "width": 4},
                {"title": "Dépistage\nactif/passif", "width": 10},
                {"title": "CATT", "width": 7},
                {"title": "RDT", "width": 7},
                {"title": "PG", "width": 7},
                {"title": "CTCWOO", "width": 7},
                {"title": "GE", "width": 7},
                {"title": "LCR", "width": 7},
                {"title": "Ponction\nNoeud\nLymph.", "width": 8},
                {"title": "Sang\nfrais", "width": 7},
                {"title": "MAECT", "width": 7},
                {"title": "PL", "width": 7},
                {"title": "ZS infection", "width": 14},
                {"title": "AS infection", "width": 14},
                {"title": "Village infection", "width": 20},
            ]

            filename = "cases"
            queryset = queryset.values(
                "id",
                "normalized_team_name",
                "normalized_date",
                "source",
                "normalized_province_name",
                "normalized_zs_name",
                "normalized_as_name",
                "AS",
                "normalized_village__name",
                "village",
                "normalized_patient__last_name",
                "normalized_patient__post_name",
                "normalized_patient__first_name",
                "normalized_patient__mothers_surname",
                "normalized_patient__sex",
                "normalized_patient__age",
                "screening_type",
                "test_catt",
                "test_rdt",
                "test_pg",
                "test_ctcwoo",
                "test_ge",
                "test_lcr",
                "test_lymph_node_puncture",
                "test_sf",
                "test_maect",
                "test_pl",
                "infection_location__AS__ZS__name",
                "infection_location__AS__name",
                "infection_location__name",
            )

            def get_row(case, **kwargs):
                return [
                    case["id"],
                    case["normalized_team_name"],
                    case["normalized_date"].strftime("%Y-%m-%d %H:%M")
                    if type(case["normalized_date"]) is datetime
                    else case["normalized_date"],
                    case["source"],
                    case["normalized_province_name"],
                    case["normalized_zs_name"],
                    case["normalized_as_name"]
                    if case["normalized_as_name"]
                    else case["AS"],
                    case["normalized_village__name"]
                    if case["normalized_village__name"]
                    else case["village"],
                    case["normalized_patient__last_name"]
                    if not anonymous
                    else ANONYMOUS_PLACEHOLDER,
                    case["normalized_patient__post_name"]
                    if not anonymous
                    else ANONYMOUS_PLACEHOLDER,
                    case["normalized_patient__first_name"]
                    if not anonymous
                    else ANONYMOUS_PLACEHOLDER,
                    case["normalized_patient__mothers_surname"]
                    if not anonymous
                    else ANONYMOUS_PLACEHOLDER,
                    case["normalized_patient__sex"],
                    case["normalized_patient__age"],
                    case["screening_type"],
                    testResultString(case["test_catt"]),
                    testResultString(case["test_rdt"]),
                    testResultString(case["test_pg"]),
                    testResultString(case["test_ctcwoo"]),
                    testResultString(case["test_ge"]),
                    testResultString(case["test_lcr"]),
                    testResultString(case["test_lymph_node_puncture"]),
                    testResultString(case["test_sf"]),
                    testResultString(case["test_maect"]),
                    testResultString(case["test_pl"]),
                    case["infection_location__AS__ZS__name"],
                    case["infection_location__AS__name"],
                    case["infection_location__name"],
                ]

            if xlsx_format:
                filename = filename + ".xlsx"
                response = HttpResponse(
                    generate_xlsx("Cas", columns, queryset, get_row),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            elif csv_format:
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(queryset, Echo(), columns, get_row)),
                    content_type="text/csv",
                )
                filename = filename + ".csv"
            else:
                return Response(
                    "Invalid format parameter parameter",
                    status=status.HTTP_400_BAD_REQUEST,
                )
            response["Content-Disposition"] = "attachment; filename=%s" % filename
            return response

    def retrieve(self, request, pk=None):
        full = request.GET.get("full")
        case = get_object_or_404(Case, pk=pk)
        is_authorized = is_authorized_user(
            request.user,
            case.normalized_AS.ZS.province.id if case.normalized_AS else None,
            case.normalized_AS.ZS.id if case.normalized_AS else None,
            case.normalized_AS.id if case.normalized_AS else None,
        )
        if is_authorized:
            return Response(case.as_dict(full is not None))
        else:
            return Response("Unauthorized", status=401)

    def partial_update(self, request, pk=None):
        case = get_object_or_404(Case, pk=pk)
        is_authorized = is_authorized_user(
            request.user,
            case.normalized_AS.ZS.province.id if case.normalized_AS else None,
            case.normalized_AS.ZS.id if case.normalized_AS else None,
            case.normalized_AS.id if case.normalized_AS else None,
        )

        if is_authorized:
            original_copy = copy(case)
            village_id = request.data.get("village_id", None)
            not_found = request.data.get("not_found", None)

            if village_id:
                village = get_object_or_404(Village, pk=village_id)
                case.normalized_village_not_found = False
                case.normalized_village = village
                case.normalized_AS = village.AS
                case.save()
                case.normalized_patient.origin_village = village
                case.normalized_patient.origin_area = village.AS
                case.normalized_patient.save()
            elif not_found:
                case.normalized_village_not_found = True
                case.normalized_village_id = None
                case.save()
            else:
                if not request.user.is_superuser and not request.user.has_perm("menupermissions.x_datas_patient_edition"):
                    return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

                case.screening_type = request.data.get("screening_type", None)
                case.test_pl_result = request.data.get("test_pl_result", None)
                case.normalized_team = get_request_team(request.data.get("team", None))
                document_date = request.data.get("document_date", None)
                if document_date:
                    case.document_date = dateparse.parse_datetime(document_date)
                case.device_id = request.data.get("device_id", None)
                case.form_number = request.data.get("form_number", None)
                case.form_year = request.data.get("form_year", None)
                case.source = request.data.get("source", None)

                village_id = request.data.get("villageId", None)
                if village_id:
                    village = get_object_or_404(Village, id=village_id)
                    case.normalized_village = village
                    case.latitude = village.latitude
                    case.longitude = village.longitude
                    case.normalized_AS = village.AS
                    case.document_id = create_documentid(case)  # Village is part of the document_id but not hat_id
                infection_location = request.data.get("infectionLocationVillageId", None)
                if infection_location:
                    infection_village = get_object_or_404(Village, id=infection_location)
                    case.infection_location = infection_village
                case.infection_location_type = request.data.get("infection_location_type", None)

                case.circumstances_da_um = request.data.get("circumstances_da_um", None)
                case.circumstances_dp_um = request.data.get("circumstances_dp_um", None)
                case.circumstances_dp_cdtc = request.data.get("circumstances_dp_cdtc", None)
                case.circumstances_dp_cs = request.data.get("circumstances_dp_cs", None)
                case.circumstances_dp_hgr = request.data.get("circumstances_dp_hgr", None)
                case.save()

            log_modification(original_copy, case, source=CASE_API, user=request.user)

            return Response(case.as_dict())
        else:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)


    def create(self, request):
        new_case = Case()
        new_case.screening_type = request.data.get("screening_type", None)
        new_case.test_pl_result = request.data.get("test_pl_result", None)
        new_case.normalized_team = get_request_team(request.data.get("team", None))

        if not request.user.is_superuser and not request.user.has_perm("menupermissions.x_datas_patient_edition"):
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

        patient_id = request.data.get("patient_id", None)
        patient = get_object_or_404(Patient, id=patient_id)
        document_date = request.data.get("document_date", None)
        if document_date:
            new_case.document_date = dateparse.parse_datetime(document_date)
        new_case.normalized_patient = patient
        new_case.name = patient.post_name
        new_case.lastname = patient.last_name
        new_case.prename = patient.first_name
        new_case.age = patient.age
        new_case.sex = patient.sex
        new_case.year_of_birth = patient.year_of_birth
        new_case.mothers_surname = patient.mothers_surname
        new_case.device_id = request.data.get("device_id", None)
        new_case.form_number = request.data.get("form_number", None)
        new_case.form_year = request.data.get("form_year", None)
        new_case.source = request.data.get("source", None)
        village_id = request.data.get("villageId", None)
        if village_id:
            village = get_object_or_404(Village, id=village_id)
            new_case.normalized_village = village
            new_case.latitude = village.latitude
            new_case.longitude = village.longitude
            new_case.normalized_AS = village.AS
        infection_location = request.data.get("infectionLocationVillageId", None)
        if infection_location:
            infection_village = get_object_or_404(Village, id=infection_location)
            new_case.infection_location = infection_village
        new_case.infection_location_type = request.data.get("infection_location_type", None)
        new_case.circumstances_da_um = request.data.get("circumstances_da_um", None)
        new_case.circumstances_dp_um = request.data.get("circumstances_dp_um", None)
        new_case.circumstances_dp_cdtc = request.data.get("circumstances_dp_cdtc", None)
        new_case.circumstances_dp_cs = request.data.get("circumstances_dp_cs", None)
        new_case.circumstances_dp_hgr = request.data.get("circumstances_dp_hgr", None)
        new_case.hat_id = hat_id(new_case)
        new_case.document_id = create_documentid(new_case)
        new_case.save()

        return Response(new_case.as_dict())

    def delete(self, request, pk=None):
        case = get_object_or_404(Case, pk=pk)

        full_delete = request.query_params.get("full_delete", None)
        if full_delete and full_delete.lower() == "true":
            if not request.user.is_superuser:
                return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

            try:
                result = full_delete_case(case)
            except Exception as exc:
                return Response(str(exc), status=status.HTTP_424_FAILED_DEPENDENCY)

            return Response(result)
        else:
            # TODO support simple trypelim admins
            if not request.user.has_perm("menupermissions.x_datas_patient_edition"):
                return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

            case.mark_for_deletion = not case.mark_for_deletion
            case.save()
            return Response(case.as_dict())


@transaction.atomic
def full_delete_case(case):
    # First get the JSON Document (necessary to be able to recover from the delete)
    marked_documents = case.jsondocument_set.all().update(deleted=True)
    if marked_documents == 0:
        raise Exception("Cannot delete a record without a JSON Document for recovery")
    deleted_tests = case.test_set.all().delete()
    patient = case.normalized_patient
    deleted_case = case.delete()
    response = {
        "marked_documents": marked_documents,
        "deleted_tests": deleted_tests,
        "deleted_case": deleted_case,
        "deleted_patient": None,
    }
    if patient.case_set.count() == 0:
        # Treatment, duplicate pairs and duplicate ignore are cascaded and will report in this deleted_patient
        response["deleted_patient"] = patient.delete()

    return response


def get_request_team(team):
    if team:
        normalize_team_item = team.get("normalized_team")
        if normalize_team_item:
            normalize_team_id = normalize_team_item.get("id")
            if normalize_team_id:
                new_team = get_object_or_404(Team, id=normalize_team_id)
                return new_team
    return None
