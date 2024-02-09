from django.http import HttpResponse
from iaso.models import Entity
from .models import Beneficiary
from django.shortcuts import get_object_or_404
from django.template import loader
from django.contrib.admin.views.decorators import staff_member_required
from .common import ETL


@staff_member_required
def debug(request, id):
    entity = get_object_or_404(Entity, id=id)
    beneficiary = Beneficiary.objects.filter(entity_id=entity.id).first()

    template = loader.get_template("debug.html")
    context = {"entity": entity, "beneficiary": beneficiary}
    return HttpResponse(template.render(context, request))


@staff_member_required
def delete_beneficiaries_analytics(request):
    ETL().delete_beneficiaries()
    return HttpResponse("ok")
