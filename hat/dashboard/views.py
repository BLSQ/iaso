from datetime import datetime, timedelta
from django.contrib.auth.decorators import login_required, permission_required
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
def home(request):
    return render(request, 'dashboard/home.html')


@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def monthly_report(request):
    locations = Case.objects \
                    .filter(source='mobile_backup') \
                    .filter(ZS__isnull=False) \
                    .values('ZS') \
                    .distinct()
    # Use the start of tomorrow as the maxium date to omit records with wrong future dates
    today = datetime.today()
    max_date = datetime(today.year, today.month, today.day) + timedelta(days=1)
    dates = Case.objects \
                .filter(source='mobile_backup') \
                .filter(document_date__isnull=False) \
                .filter(document_date__lt=max_date) \
                .annotate(date=RawSQL('date_trunc(%s, document_date)', ('month',))) \
                .values('date') \
                .order_by('date') \
                .distinct()

    json_data = json.dumps({
        'locations': list(locations),
        # dates formatted as 2014-06
        'dates': [d['date'].strftime("%Y-%m") for d in dates]
    })

    return render(request, 'dashboard/monthly_report.html', {'json_data': json_data})


@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def stats(request):
    # locations = Case.objects \
    #                 .filter(ZS__isnull=False) \
    #                 .values('ZS') \
    #                 .distinct()
    # sources = Case.objects.order_by().values('source').distinct()

    # # Use the start of tomorrow as the maxium date to omit records with wrong future dates
    # today = datetime.today()
    # max_date = datetime(today.year, today.month, today.day) + timedelta(days=1)
    # dates = Case.objects \
    #             .filter(document_date__isnull=False) \
    #             .filter(document_date__lt=max_date) \
    #             .annotate(date=RawSQL('date_trunc(%s, document_date)', ('month',))) \
    #             .values('date') \
    #             .order_by('date') \
    #             .distinct()

    # http://stackoverflow.com/questions/7650448/django-serialize-queryset-values-into-json
    json_data = json.dumps(
            {
                # 'locations': list(locations),
                # 'sources': [s['source'] for s in sources],
                # dates formatted as 2014-06
                # 'dates': [d['date'].strftime("%Y-%m") for d in dates]
            }
        )

    return render(request, 'dashboard/stats.html', {'json_data': json_data})


@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def suspect_cases(request):
    sources = Case.objects.order_by().values('source').distinct()
    json_data = json.dumps({
        'sources': [s['source'] for s in sources],
    })
    return render(request, 'dashboard/suspect_cases.html', {'json_data': json_data})


@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def microplanning(request):
    sources = Case.objects.order_by().values('source').distinct()
    json_data = json.dumps({
        'sources': [s['source'] for s in sources],
    })
    return render(request, 'dashboard/microplanning.html', {'json_data': json_data})
