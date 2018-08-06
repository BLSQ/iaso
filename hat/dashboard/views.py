from datetime import datetime, timedelta
from django.contrib.auth.decorators import login_required, permission_required
from django.views.decorators.http import require_http_methods
from django.shortcuts import render
from django.http.request import HttpRequest
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.conf import settings

from hat.planning.models import Planning, Assignation
from hat.users.models import Team, Coordination
import csv
import json

from hat.cases.models import CaseView


@login_required()
@require_http_methods(['GET'])
def home(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/home.html')


@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def monthly_report(request: HttpRequest) -> HttpResponse:
    # Use the start of tomorrow as the maximum date to omit records with wrong future dates
    today = datetime.today()
    max_date = datetime(today.year, today.month, today.day) + timedelta(days=1)
    dates = CaseView.objects \
                    .filter(source__icontains='mobile') \
                    .filter(normalized_date__isnull=False) \
                    .filter(normalized_date__lt=max_date) \
                    .order_by('normalized_date_month') \
                    .values_list('normalized_date_month', flat=True) \
                    .distinct()

    json_data = json.dumps({
        # dates formatted as 2014-06
        'dates': [d.strftime('%Y-%m') for d in dates]
    })

    return render(request, 'dashboard/monthly_report.html', {'json_data': json_data})


@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def stats(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/stats.html')


@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def plannings(request: HttpRequest) -> HttpResponse:

    return render(request, 'dashboard/plannings.html', {'STATIC_URL': settings.STATIC_URL})


# @login_required()
# @permission_required('cases.view')
# @require_http_methods(['GET'])
# def planning(request: HttpRequest, planning_id) -> HttpResponse:
#     return render(request, 'dashboard/plannings.html')

@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def coordination(request: HttpRequest, coordination_id) -> HttpResponse:
    return render(request, 'dashboard/plannings.html')


@login_required()
@require_http_methods(['GET'])
def csv_export(request: HttpRequest, planning_id) -> HttpResponse:
    # Create the HttpResponse object with the appropriate CSV header.
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="planning.csv"'

    writer = csv.writer(response)
    planning = get_object_or_404(Planning, pk=planning_id)

    assignations = Assignation.objects.filter(planning=planning).order_by('team__name', 'village__population')
    writer.writerow(['Equipe', 'Coordination', 'Capacite', 'UM', 'Village', 'Latitude',
                     'Longitude', 'Population', 'AS', 'ZS', 'Province', 'Nombre Cas'])
    for assignation in assignations:

        team = assignation.team
        village = assignation.village
        if team.UM:
            type = "UM"
        else:
            type = "MUM"
        writer.writerow([team.name,
                         team.coordination.name,
                         team.capacity,
                         type,
                         village.name,
                         village.latitude,
                         village.longitude,
                         village.population,
                         village.AS.name,
                         village.AS.ZS.name,
                         village.AS.ZS.province.name,
                         village.case_set.filter(form_year__in=[2013, 2014, 2015, 2016, 2017], confirmed_case=True).count()
                         ])

    return response



@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def device_management(request: HttpRequest) -> HttpResponse:
    # Use the start of tomorrow as the maximum date to omit records with wrong future dates
    today = datetime.today()
    max_date = datetime(today.year, today.month, today.day) + timedelta(days=1)
    dates = CaseView.objects \
                    .filter(source__icontains='mobile') \
                    .filter(document_date__isnull=False) \
                    .filter(document_date__lt=max_date) \
                    .order_by('document_date_month') \
                    .values_list('document_date_month', flat=True) \
                    .distinct()

    json_data = json.dumps({
        # dates formatted as 2014-06
        'dates': [d.strftime('%Y-%m') for d in dates]
    })

    return render(request, 'dashboard/management.html', {'json_data': json_data, 'STATIC_URL': settings.STATIC_URL})

@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def managementAll(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/management.html', {'json_data': [], 'STATIC_URL': settings.STATIC_URL})


@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def locator(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/locator.html', {'STATIC_URL': settings.STATIC_URL})

@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def vector(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/vector.html', {})

@login_required()
@permission_required('quality.change_check')
@require_http_methods(['GET'])
def quality_control(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/quality_control.html', {'test_count': range(1,7)})
