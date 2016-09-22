from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.shortcuts import render
# from django.db.models.expressions import RawSQL
# from django.core.serializers.json import DjangoJSONEncoder
# import json

# from hat.cases.models import Case


@login_required()
@require_http_methods(['GET'])
def testapp(request):
    return render(request, 'dashboard/testapp.html')


@login_required()
@require_http_methods(['GET'])
def monthly_report(request):
    # TODO: JSON Serialize this and output on page
    # locations = Case.objects.order_by().values('ZS', 'AZ').distinct()
    # sources = Case.objects.order_by().values('source').distinct()
    # dates = Case.objects \
    #             .annotate(date=RawSQL('date_trunc(%s, document_date)', ('month',))) \
    #             .values('date') \
    #             .order_by('date') \
    #             .distinct()

    # http://stackoverflow.com/questions/7650448/django-serialize-queryset-values-into-json
    # jsonData = json.dumps(
    #         {
    #             'locations': locations,
    #             'sources': sources,
    #             'dates': dates
    #         },
    #         cls = DjangoJSONEncoder
    #     )

    return render(request, 'dashboard/monthly_report.html')
