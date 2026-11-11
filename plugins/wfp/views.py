import io

from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required, permission_required
from django.core.management import call_command
from django.core.paginator import Paginator
from django.db.models import F
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import get_list_or_404, get_object_or_404
from django.template import loader
from django.utils import timezone

from iaso.models import Entity, EntityType, Group
from iaso.utils.pii import filter_submission_json

from .common import ETL
from .utils.details import beneficiary_details, submission_details
from .utils.exports import KIND_CODA, KIND_RAW, export_response
from .filters import (
    attach_journeys,
    facility_scope,
    filtered_beneficiaries,
    filters_from_params,
    with_counts,
)
from .models import NUTRITION_PROGRAMMES, Beneficiary, Journey, Visit
from .permissions import WFP_BENEFICIARY_EXPORT_PERMISSION


@login_required
def debug(request, id):
    entity = get_object_or_404(Entity.objects.filter_for_user(request.user), id=id)

    beneficiary = Beneficiary.objects.filter(entity_id=entity.id).first()
    beneficiary_info = filter_submission_json(entity.attributes.json, entity.attributes.form, request.user)

    template = loader.get_template("debug.html")
    context = {"entity": entity, "beneficiary": beneficiary, "info": beneficiary_info}
    return HttpResponse(template.render(context, request))


def _user_account(user):
    profile = getattr(user, "iaso_profile", None)
    return profile.account if profile else None


def _facility_scope(request):
    return facility_scope(request.user, filters_from_params(request.GET))


def _filtered_beneficiaries(request, account, org_units=None):
    return filtered_beneficiaries(account, filters_from_params(request.GET), org_units)


export_permission_required = permission_required(WFP_BENEFICIARY_EXPORT_PERMISSION.full_name(), raise_exception=True)


@login_required
@export_permission_required
def beneficiaries(request):
    """List the beneficiaries computed by the ETL for the account of the current user, with their visits."""
    account = _user_account(request.user)
    if account is None:
        return HttpResponseForbidden("User has no account")

    org_units = _facility_scope(request)
    queryset = _filtered_beneficiaries(request, account, org_units)
    entity_type_id = request.GET.get("entity_type", "")
    programme = request.GET.get("programme", "")
    org_unit_group_id = request.GET.get("org_unit_group", "")
    search = request.GET.get("q", "").strip()

    queryset = with_counts(queryset, org_units).order_by(F("last_visit_date").desc(nulls_last=True), "-id")

    page = Paginator(queryset, 50).get_page(request.GET.get("page"))
    attach_journeys(page.object_list, org_units)

    query_without_page = request.GET.copy()
    query_without_page.pop("page", None)

    template = loader.get_template("beneficiaries.html")
    context = {
        "account": account,
        "page": page,
        "entity_types": EntityType.objects.filter(account=account).order_by("name"),
        "programmes": NUTRITION_PROGRAMMES,
        "org_unit_groups": Group.objects.filter_for_user(request.user)
        .select_related("source_version__data_source")
        .order_by("name", "id"),
        "selected_entity_type": entity_type_id,
        "selected_programme": programme,
        "selected_org_unit_group": org_unit_group_id,
        "search": search,
        "query_without_page": query_without_page.urlencode(),
    }
    return HttpResponse(template.render(context, request))


@login_required
@export_permission_required
def beneficiaries_coda_export(request):
    """The beneficiaries of the screen (same filters) exported in the "CODA 2.0 Full data fields" format.

    With an org unit group, only the visits made in its org units are exported.
    """
    if _user_account(request.user) is None:
        return HttpResponseForbidden("User has no account")
    return export_response(request.user, KIND_CODA, filters_from_params(request.GET))


@login_required
@export_permission_required
def beneficiaries_raw_export(request):
    """The ETL tables and the submissions of the beneficiaries of the screen (same filters), one sheet per form.

    With an org unit group, only the visits and the submissions made in its org units are exported.
    """
    if _user_account(request.user) is None:
        return HttpResponseForbidden("User has no account")
    return export_response(request.user, KIND_RAW, filters_from_params(request.GET))


@login_required
def beneficiary_data(request, entity_id):
    """HTML fragment with all the data of a beneficiary, shown in a popup of the beneficiaries screen.

    Submissions are found through their entity_id, so this also shows submissions not used by the ETL.
    """
    account = _user_account(request.user)
    if account is None:
        return HttpResponseForbidden("User has no account")
    template = loader.get_template("beneficiary_data.html")
    return HttpResponse(template.render(beneficiary_details(request.user, account, entity_id), request))


@login_required
def submission_fields(request, instance_id):
    """HTML fragment with all the fields of a submission, shown when hovering a submission in the beneficiaries screen."""
    account = _user_account(request.user)
    if account is None:
        return HttpResponseForbidden("User has no account")
    template = loader.get_template("submission_fields.html")
    return HttpResponse(template.render(submission_details(request.user, account, instance_id), request))


@login_required
def debug_summary(request):
    now = timezone.now()
    allowed_entities = Entity.objects.filter_for_user(request.user)
    allowed_entity_ids = allowed_entities.values_list("id", flat=True)

    negative_journeys_qs = Journey.objects.filter(
        duration__lt=0, beneficiary__entity_id__in=allowed_entity_ids
    ).select_related("beneficiary", "beneficiary__account")

    negative_count = negative_journeys_qs.count()

    recent_negatives = negative_journeys_qs.prefetch_related("visit_set__step_set").order_by("-id")

    future_visits_qs = Visit.objects.filter(
        date__gt=now, journey__beneficiary__entity_id__in=allowed_entity_ids
    ).select_related("journey__beneficiary", "journey__beneficiary__account")

    visits_with_missing_date = Visit.objects.filter(
        date__isnull=True, journey__beneficiary__entity_id__in=allowed_entity_ids
    ).select_related("journey__beneficiary", "journey__beneficiary__account")

    future_count = future_visits_qs.count()
    recent_future_visits = future_visits_qs.order_by("-date")[:3]
    visits_without_date = visits_with_missing_date
    without_date_count = visits_with_missing_date.count()

    template = loader.get_template("debug_summary.html")
    context = {
        "negative_count": negative_count,
        "recent_negatives": recent_negatives,
        "future_count": future_count,
        "recent_future_visits": recent_future_visits,
        "without_date_count": without_date_count,
        "visits_without_date": visits_without_date,
    }
    return HttpResponse(template.render(context, request))


@login_required
def show_missing_entities_in_analytics(request, account_id, entity_type):
    entities = get_list_or_404(ETL().missing_entities_in_analytics_tables(account_id, entity_type, request.user))
    beneficiary_type = EntityType.objects.filter(id=entity_type).first()
    template = loader.get_template("show_missing_beneficiaries.html")
    context = {
        "beneficiary_type": beneficiary_type.name,
        "entities": entities,
        "account": account_id,
        "entity_type": entity_type,
        "number": len(list(entities)),
    }
    return HttpResponse(template.render(context, request))


@staff_member_required
def delete_beneficiaries_analytics(request, account_id):
    if request.method == "POST":
        ETL().delete_beneficiaries(account_id)
        return HttpResponse("ok")

    template = loader.get_template("delete_beneficiaries_analytics.html")

    return HttpResponse(template.render({"account_id": account_id}, request))


@staff_member_required
def delete_all_instances_and_entities(request):
    dry_run = request.POST.get("dry_run", False)
    account = request.POST.get("account", None)
    entity_type_id = request.POST.get("entity_type_id", None)

    if request.method == "POST":
        out = io.StringIO()
        call_command(
            "delete_all_instances_and_entities",
            dry_run=dry_run == "on",
            account=account,
            entity_type_id=entity_type_id,
            stdout=out,
        )
        output = out.getvalue()

        return HttpResponse(output.replace("\n", "<br>"))

    template = loader.get_template("delete_all_instances_and_entities.html")

    return HttpResponse(template.render({}, request))
