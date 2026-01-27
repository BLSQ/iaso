import io

from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.core.management import call_command
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.template import loader

from iaso.models import Entity, EntityType

from .common import ETL
from .models import Beneficiary


@login_required
def debug(request, id):
    entity = get_object_or_404(Entity.objects.filter_for_user(request.user), id=id)

    beneficiary = Beneficiary.objects.filter(entity_id=entity.id).first()
    beneficiary_info = entity.attributes.json

    template = loader.get_template("debug.html")
    context = {"entity": entity, "beneficiary": beneficiary, "info": beneficiary_info}
    return HttpResponse(template.render(context, request))


@login_required
def show_missing_entities_in_analytics(request, account_id, entity_type):
    entities = ETL().missing_entities_in_analytics_tables(account_id, entity_type)
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
