import io

from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.core.management import call_command
from django.http import HttpResponse
from django.shortcuts import get_list_or_404, get_object_or_404
from django.template import loader
from django.utils import timezone

from iaso.models import Entity, EntityType

from .common import ETL
from .models import Beneficiary, Journey, Visit


@login_required
def debug(request, id):
    entity = get_object_or_404(Entity.objects.filter_for_user(request.user), id=id)

    beneficiary = Beneficiary.objects.filter(entity_id=entity.id).first()
    beneficiary_info = entity.attributes.json

    template = loader.get_template("debug.html")
    context = {"entity": entity, "beneficiary": beneficiary, "info": beneficiary_info}
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
def delete_beneficiaries_analytics(request):
    if request.method == "POST":
        ETL().delete_beneficiaries()
        return HttpResponse("ok")

    template = loader.get_template("delete_beneficiaries_analytics.html")

    return HttpResponse(template.render({}, request))


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
