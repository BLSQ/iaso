import io
import tempfile

from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.core.management import call_command
from django.core.paginator import Paginator
from django.db.models import Count, F, Max, Prefetch
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import get_list_or_404, get_object_or_404
from django.template import loader
from django.utils import timezone

from iaso.exports.cleaning_file_response import CleaningFileResponse
from iaso.models import Entity, EntityType, Instance
from iaso.utils.pii import filter_submission_json

from .coda_export import build_xlsx
from .common import ETL
from .models import NUTRITION_PROGRAMMES, Beneficiary, Journey, Visit
from .raw_export import build_raw_xlsx


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


def _flatten_json(data, prefix=""):
    """Turn a submission JSON into a flat list of (path, value) rows for display."""
    rows = []
    if isinstance(data, dict):
        for key, value in data.items():
            rows.extend(
                _flatten_json(value, f"{prefix}{key}/" if isinstance(value, (dict, list)) else f"{prefix}{key}")
            )
    elif isinstance(data, list):
        for index, value in enumerate(data):
            rows.extend(
                _flatten_json(value, f"{prefix}{index}/" if isinstance(value, (dict, list)) else f"{prefix}{index}")
            )
    else:
        rows.append((prefix, data))
    return rows


def _filtered_beneficiaries(request, account):
    """Beneficiaries of the account matching the filters of the beneficiaries screen (shared with its export)."""
    queryset = Beneficiary.objects.filter(entity__account=account).select_related("entity__entity_type")

    entity_type_id = request.GET.get("entity_type", "")
    if entity_type_id.isdigit():
        queryset = queryset.filter(entity__entity_type_id=entity_type_id)

    programme = request.GET.get("programme", "")
    if programme:
        # Subquery rather than a join, so that the counts of the screen still cover all the journeys.
        queryset = queryset.filter(
            id__in=Journey.objects.filter(nutrition_programme=programme).values("beneficiary_id")
        )

    search = request.GET.get("q", "").strip()
    if search.isdigit():
        queryset = queryset.filter(entity_id=search)
    elif search:
        queryset = queryset.filter(entity__uuid__startswith=search)
    return queryset


@login_required
def beneficiaries(request):
    """List the beneficiaries computed by the ETL for the account of the current user, with their visits."""
    account = _user_account(request.user)
    if account is None:
        return HttpResponseForbidden("User has no account")

    queryset = _filtered_beneficiaries(request, account)
    entity_type_id = request.GET.get("entity_type", "")
    programme = request.GET.get("programme", "")
    search = request.GET.get("q", "").strip()

    queryset = queryset.annotate(
        journeys_count=Count("journey", distinct=True),
        visits_count=Count("journey__visit", distinct=True),
        last_visit_date=Max("journey__visit__date"),
    ).order_by(F("last_visit_date").desc(nulls_last=True), "-id")

    page = Paginator(queryset, 50).get_page(request.GET.get("page"))
    # Prefetch the visits of the current page only.
    beneficiaries_on_page = Beneficiary.objects.filter(id__in=[b.id for b in page.object_list]).prefetch_related(
        Prefetch("journey_set", queryset=Journey.objects.order_by("start_date", "id")),
        Prefetch(
            "journey_set__visit_set",
            queryset=Visit.objects.select_related("org_unit").prefetch_related("step_set").order_by("date", "id"),
        ),
    )
    journeys_by_beneficiary = {b.id: list(b.journey_set.all()) for b in beneficiaries_on_page}
    for beneficiary in page.object_list:
        beneficiary.journeys = journeys_by_beneficiary.get(beneficiary.id, [])

    query_without_page = request.GET.copy()
    query_without_page.pop("page", None)

    template = loader.get_template("beneficiaries.html")
    context = {
        "account": account,
        "page": page,
        "entity_types": EntityType.objects.filter(account=account).order_by("name"),
        "programmes": NUTRITION_PROGRAMMES,
        "selected_entity_type": entity_type_id,
        "selected_programme": programme,
        "search": search,
        "query_without_page": query_without_page.urlencode(),
    }
    return HttpResponse(template.render(context, request))


@login_required
def beneficiaries_coda_export(request):
    """The beneficiaries of the screen (same filters) exported in the "CODA 2.0 Full data fields" format."""
    account = _user_account(request.user)
    if account is None:
        return HttpResponseForbidden("User has no account")

    tmp = tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False)
    tmp.close()
    build_xlsx(_filtered_beneficiaries(request, account), request.user, tmp.name)
    filename = f"coda-2-export-{timezone.now():%Y-%m-%d-%H-%M}.xlsx"
    return CleaningFileResponse(tmp.name, as_attachment=True, filename=filename)


@login_required
def beneficiaries_raw_export(request):
    """The ETL tables and the submissions of the beneficiaries of the screen (same filters), one sheet per form."""
    account = _user_account(request.user)
    if account is None:
        return HttpResponseForbidden("User has no account")

    tmp = tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False)
    tmp.close()
    build_raw_xlsx(_filtered_beneficiaries(request, account), request.user, tmp.name)
    filename = f"wfp-raw-data-{timezone.now():%Y-%m-%d-%H-%M}.xlsx"
    return CleaningFileResponse(tmp.name, as_attachment=True, filename=filename)


@login_required
def beneficiary_data(request, entity_id):
    """HTML fragment with all the data of a beneficiary, shown in a popup of the beneficiaries screen.

    Submissions are found through their entity_id, so this also shows submissions not used by the ETL.
    """
    account = _user_account(request.user)
    if account is None:
        return HttpResponseForbidden("User has no account")

    entity = get_object_or_404(
        Entity.objects.filter(account=account).select_related("entity_type", "attributes"), id=entity_id
    )
    beneficiary = Beneficiary.objects.filter(entity_id=entity.id).first()
    submissions = (
        Instance.objects.filter(entity_id=entity.id)
        .select_related("form", "org_unit")
        .order_by("source_created_at", "created_at")
    )
    for submission in submissions:
        submission.rows = _flatten_json(filter_submission_json(submission.json or {}, submission.form, request.user))

    template = loader.get_template("beneficiary_data.html")
    context = {
        "entity": entity,
        "beneficiary": beneficiary,
        "attributes": (
            _flatten_json(filter_submission_json(entity.attributes.json or {}, entity.attributes.form, request.user))
            if entity.attributes
            else []
        ),
        "submissions": submissions,
    }
    return HttpResponse(template.render(context, request))


@login_required
def submission_fields(request, instance_id):
    """HTML fragment with all the fields of a submission, shown when hovering a submission in the beneficiaries screen."""
    account = _user_account(request.user)
    if account is None:
        return HttpResponseForbidden("User has no account")

    submission = get_object_or_404(
        Instance.objects.filter(entity__account=account).select_related("form", "org_unit"), id=instance_id
    )
    template = loader.get_template("submission_fields.html")
    context = {
        "submission": submission,
        "rows": _flatten_json(filter_submission_json(submission.json or {}, submission.form, request.user)),
    }
    return HttpResponse(template.render(context, request))


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
