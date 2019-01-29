from copy import copy
from datetime import datetime, timedelta
from django.contrib.auth.decorators import login_required, permission_required
from django.views.decorators.http import require_http_methods
from django.shortcuts import render, redirect
from django.http.request import HttpRequest
from django.http import HttpResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.urls import reverse

from hat.audit.models import log_modification, PASSWORD_API
from hat.planning.models import Planning, Assignation
from django.contrib import messages
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm
from django.utils.translation import ugettext as _
from .utils import is_user_authorized, get_menu

import json

from hat.cases.models import CaseView

import xlsxwriter
import io
import csv

@login_required()
def change_password(request):
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            original_user = copy(request.user)
            user = form.save()
            user.profile.password_reset = False
            user.save()
            update_session_auth_hash(request, user)
            log_modification(original_user, user, PASSWORD_API, original_user)
            messages.success(request, _('Your password was successfully updated'))
            return redirect('/dashboard/home')
    else:
        form = PasswordChangeForm(request.user)
    return render(request, 'dashboard/change_password.html', {
        'form': form
    })

@require_http_methods(['GET'])
def home(request: HttpRequest) -> HttpResponse:
    user = request.user
    if user.is_anonymous:
        return render(request, 'dashboard/home.html')
    else:
        if user.profile.password_reset:
            return redirect('/dashboard/password')
        else:
            return render(request, 'dashboard/home.html', {'menu': get_menu(user, reverse("dashboard:home"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_stats_reports')
@require_http_methods(['GET'])
def monthly_report(request: HttpRequest) -> HttpResponse:
    # Use the start of tomorrow as the maximum date to omit records with wrong future dates

    return render(request, 'dashboard/monthly_report.html', {'menu': get_menu(request.user, reverse("dashboard:monthly_report"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_stats_graphs')
@require_http_methods(['GET'])
def stats(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/stats.html', {'menu': get_menu(request.user, reverse("dashboard:stats"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_plannings_microplanning')
@require_http_methods(['GET'])
def plannings_micro(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/plannings.html', {'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(request.user, reverse("dashboard:micro"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_plannings_macroplanning')
@require_http_methods(['GET'])
def plannings_macro(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/plannings.html', {'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(request.user, reverse("dashboard:macro"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_plannings_routes')
@require_http_methods(['GET'])
def plannings_routes(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/plannings.html', {'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(request.user, reverse("dashboard:routes"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_management_devices')
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

    return render(request, 'dashboard/management.html', {'json_data': json_data, 'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(request.user, reverse("dashboard:management_devices"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_management_teams')
@require_http_methods(['GET'])
def teams_management(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/management.html', {'json_data': [], 'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(request.user, reverse("dashboard:management_team"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_management_coordinations')
@require_http_methods(['GET'])
def coordinations_management(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/management.html', {'json_data': [], 'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(request.user, reverse("dashboard:management_coord"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_management_workzones')
@require_http_methods(['GET'])
def workzones_management(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/management.html', {'json_data': [], 'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(request.user, reverse("dashboard:management_workzone"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_management_plannings')
@require_http_methods(['GET'])
def plannings_management(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/management.html', {'json_data': [], 'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(request.user, reverse("dashboard:management_planning"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_management_users')
@require_http_methods(['GET'])
def users_management(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/management.html', {'json_data': [], 'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(request.user, reverse("dashboard:management_user"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_management_villages')
@require_http_methods(['GET'])
def villages_management(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/management.html', {'json_data': [], 'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(request.user, reverse("dashboard:management_village"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_locator')
@require_http_methods(['GET'])
def locator(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/locator.html', {'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(request.user, reverse("dashboard:locator_list"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_vectorcontrol')
@require_http_methods(['GET'])
def vector(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/vector.html', {'menu': get_menu(request.user, reverse("dashboard:vector"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_vectorcontrolupload')
@require_http_methods(['GET'])
def vector_sync(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/vector.html', {'menu': get_menu(request.user, reverse("dashboard:vector_sync"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_vectorcontrolupload')
@require_http_methods(['GET'])
def vector_upload(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/vector.html', {'menu': get_menu(request.user, reverse("dashboard:vector_upload"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_qualitycontrol')
@require_http_methods(['GET'])
def quality_control(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/quality_control.html', {'test_count': range(1,7), 'menu': get_menu(request.user, reverse("dashboard:quality-control"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_case_cases')
@require_http_methods(['GET'])
def cases_list(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/datas.html', {'menu': get_menu(request.user, reverse("dashboard:cases_list"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_case_cases')
@require_http_methods(['GET'])
def cases_detail(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/datas.html', {'menu': get_menu(request.user, reverse("dashboard:cases_list"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_case_cases')
@require_http_methods(['GET'])
def register(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/datas.html', {'menu': get_menu(request.user, reverse("dashboard:register"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_case_cases')
@require_http_methods(['GET'])
def register_detail(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/datas.html', {'menu': get_menu(request.user, reverse("dashboard:register"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_case_cases')
@require_http_methods(['GET'])
def register_duplicates(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/datas.html', {'menu': get_menu(request.user, reverse("dashboard:register_duplicates"))})

@is_user_authorized
@login_required()
@permission_required('menupermissions.x_case_cases')
@require_http_methods(['GET'])
def register_duplicates_detail(request: HttpRequest) -> HttpResponse:
    return render(request, 'dashboard/datas.html', {'menu': get_menu(request.user, reverse("dashboard:register_duplicates"))})
