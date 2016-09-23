from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.shortcuts import render
from django.db.models.expressions import RawSQL
import json

from hat.cases.models import Case


@login_required()
@require_http_methods(['GET'])
def testapp(request):
    return render(request, 'dashboard/testapp.html')


@login_required()
@require_http_methods(['GET'])
def monthly_report(request):
    locations = Case.objects.order_by().values('ZS').distinct()
    sources = Case.objects.order_by().values('source').distinct()
    dates = Case.objects \
                .annotate(date=RawSQL('date_trunc(%s, document_date)', ('month',))) \
                .values('date') \
                .order_by('date') \
                .distinct()

    # http://stackoverflow.com/questions/7650448/django-serialize-queryset-values-into-json
    json_data = json.dumps(
            {
                'locations': list(locations),
                'sources': [s['source'] for s in sources],
                # dates formatted as 2014-06
                'dates': [d['date'].strftime("%Y-%m") for d in dates]
            }
        )

    return render(request, 'dashboard/monthly_report.html', {'json_data': json_data})
