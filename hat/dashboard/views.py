from datetime import datetime, timedelta
from django.contrib.auth.decorators import login_required, permission_required
from django.views.decorators.http import require_http_methods
from django.shortcuts import render
from django.db.models.expressions import RawSQL
from django.http.request import HttpRequest
from django.http import HttpResponse
import json

from hat.cases.models import Case


@login_required()
@require_http_methods(['GET'])
def testapp(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/testapp.html')


@login_required()
@require_http_methods(['GET'])
def home(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/home.html')


@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def monthly_report(request: HttpRequest) -> HttpResponse:
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
def stats(request: HttpRequest) -> HttpResponse:
    json_data = json.dumps({})
    return render(request, 'dashboard/stats.html', {'json_data': json_data})


@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def microplanning(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/microplanning.html')
