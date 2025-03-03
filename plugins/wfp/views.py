import io

from django.contrib.admin.views.decorators import staff_member_required
from django.core.management import call_command
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.template import loader

from iaso.models import Entity

from .common import ETL
from .models import Beneficiary


@staff_member_required
def debug(request, id):
    entity = get_object_or_404(Entity, id=id)
    beneficiary = Beneficiary.objects.filter(entity_id=entity.id).first()

    template = loader.get_template("debug.html")
    context = {"entity": entity, "beneficiary": beneficiary}
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
