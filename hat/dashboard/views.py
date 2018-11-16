from copy import copy
from datetime import datetime, timedelta
from django.contrib.auth.decorators import login_required, permission_required
from django.views.decorators.http import require_http_methods
from django.shortcuts import render, redirect
from django.http.request import HttpRequest
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.urls import reverse

from hat.audit.models import log_modification, PASSWORD_API
from hat.planning.models import Planning, Assignation
from django.contrib import messages
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm
from django.utils.translation import ugettext as _
import csv
import json

from hat.cases.models import CaseView


def get_last_years(numberOfYears):
    year = datetime.now().year
    years = [str(year - i) for i in range(numberOfYears)]
    return ','.join(years)


def get_menu(user, active_link):
    menu = []
    menu_list = [
        {
            "name": "Accueil",
            "url_key": reverse("dashboard:home"),
            "items": [],
            "perms": None
        },
        {
            "name": "Statistiques",
            "url_key": reverse("dashboard:stats"),
            "items": [
                {
                    "name": "Graphes",
                    "url_key": reverse("dashboard:stats"),
                    "perms": "x_stats_graphs"
                },
                {
                    "name": "Rapports",
                    "url_key": reverse("dashboard:monthly_report"),
                    "perms": "x_stats_reports"
                }
            ],
            "perms": None
        },
        {
            "name": "Données",
            "url_key": reverse("dashboard:cases_list"),
            "items": [
                {
                    "name": "Tests",
                    "url_key": reverse("dashboard:cases_list"),
                    "perms": "x_case_cases"
                },
                {
                    "name": "Registre",
                    "url_key": reverse("dashboard:register"),
                    "perms": "x_case_cases"
                },
                {
                    "name": "Réconciliation",
                    "url_key": reverse("cases:duplicates_list"),
                    "perms": "x_case_reconciliation"
                }
            ],
            "perms": None
        },
        {
            "name": "Gestion",
            "url_key": reverse("dashboard:management_devices"),
            "items": [
                {
                    "name": "Appareils",
                    "url_key": reverse("dashboard:management_devices"),
                    "perms": "x_management_devices"
                },
                {
                    "name": "Utilisateurs",
                    "url_key": reverse("dashboard:management_user"),
                    "perms": "x_management_users"
                },
                {
                    "name": "Equipes",
                    "url_key": reverse("dashboard:management_team"),
                    "perms": "x_management_teams"
                },
                {
                    "name": "Coordinations",
                    "url_key": reverse("dashboard:management_coord"),
                    "perms": "x_management_coordinations"
                },
                {
                    "name": "Plannings",
                    "url_key": reverse("dashboard:management_planning"),
                    "perms": "x_management_plannings"
                },
                {
                    "name": "Rayons d\'actions",
                    "url_key": reverse("dashboard:management_workzone"),
                    "perms": "x_management_workzones"
                },
                {
                    "name": "Villages",
                    "url_key": reverse("dashboard:management_village") + "/village_official/YES",
                    "perms": "x_management_villages"
                }
            ],
            "perms": None
        },
        {
            "name": "Plannings",
                    "url_key": reverse("dashboard:macro"),
            "items": [
                {
                    "name": "Macroplanification",
                    "url_key": reverse("dashboard:macro") +"/years/" + get_last_years(3),
                    "perms": "x_plannings_macroplanning"
                },
                {
                    "name": "Microplanification",
                    "url_key": reverse("dashboard:micro")+"/years/" + get_last_years(3),
                    "perms": "x_plannings_microplanning"
                },
                {
                    "name": "Itinéraires",
                    "url_key": reverse("dashboard:routes"),
                    "perms": "x_plannings_routes"
                }
            ],
            "perms": None
        },
        {
            "name": "Locator",
            "url_key": reverse("dashboard:locator_list"),
            "items": [],
            "perms": "x_locator",
        },
        {
            "name": "Vector control",
            "url_key": reverse("dashboard:vector"),
            "items": [],
            "perms": "x_vectorcontrol"
        },
        {
            "name": "Contrôle de qualité",
            "url_key": reverse("dashboard:quality-control"),
            "items": [],
            "perms": "x_qualitycontrol"
        }
    ]
    for menu_item in menu_list:
        sub_menu_items = menu_item.get("items")
        add_menu = False
        if not sub_menu_items:
            if not menu_item.get("perms"):
                add_menu = True
            if menu_item.get("perms"):
                if user.has_perm('menupermissions.' + menu_item.get("perms")):
                    add_menu = True
        else :
            active_sub_menu_items = []
            for sub_menu_item in sub_menu_items:
                if not sub_menu_item.get("perms") or user.has_perm('menupermissions.' + sub_menu_item.get("perms")):
                    if active_link in sub_menu_item["url_key"] :
                        sub_menu_item["active"] = True
                        menu_item["active"] = True
                    active_sub_menu_items.append(sub_menu_item)
            if active_sub_menu_items:
                menu_item["items"] = active_sub_menu_items
                add_menu = True
        if add_menu:
            if menu_item["url_key"] == active_link:
                menu_item["active"] = True
            menu.append(menu_item)
    return menu


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

@login_required()
@require_http_methods(['GET'])
def home(request: HttpRequest) -> HttpResponse:
    user = request.user
    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/home.html', {'menu': get_menu(user, reverse("dashboard:home"))})


@login_required()
@permission_required('menupermissions.x_stats_reports')
@require_http_methods(['GET'])
def monthly_report(request: HttpRequest) -> HttpResponse:
    # Use the start of tomorrow as the maximum date to omit records with wrong future dates

    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/monthly_report.html', {'menu': get_menu(user, reverse("dashboard:monthly_report"))})


@login_required()
@permission_required('menupermissions.x_stats_graphs')
@require_http_methods(['GET'])
def stats(request: HttpRequest) -> HttpResponse:
    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/stats.html', {'menu': get_menu(user, reverse("dashboard:stats"))})


@login_required()
@permission_required('menupermissions.x_plannings_microplanning')
@require_http_methods(['GET'])
def plannings_micro(request: HttpRequest) -> HttpResponse:
    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/plannings.html', {'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(user, reverse("dashboard:micro"))})

@login_required()
@permission_required('menupermissions.x_plannings_macroplanning')
@require_http_methods(['GET'])
def plannings_macro(request: HttpRequest) -> HttpResponse:
    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/plannings.html', {'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(user, reverse("dashboard:macro"))})

@login_required()
@permission_required('menupermissions.x_plannings_routes')
@require_http_methods(['GET'])
def plannings_routes(request: HttpRequest) -> HttpResponse:
    user = request.user
    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/plannings.html', {'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(user, reverse("dashboard:routes"))})



@login_required()
@permission_required('menupermissions.x_plannings_microplanning')
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

    user = request.user
    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/management.html', {'json_data': json_data, 'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(user, reverse("dashboard:management_devices"))})

@login_required()
@permission_required('menupermissions.x_management_teams')
@require_http_methods(['GET'])
def teams_management(request: HttpRequest) -> HttpResponse:
    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/management.html', {'json_data': [], 'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(user, reverse("dashboard:management_team"))})

@login_required()
@permission_required('menupermissions.x_management_coordinations')
@require_http_methods(['GET'])
def coordinations_management(request: HttpRequest) -> HttpResponse:
    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/management.html', {'json_data': [], 'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(user, reverse("dashboard:management_coord"))})

@login_required()
@permission_required('menupermissions.x_management_workzones')
@require_http_methods(['GET'])
def workzones_management(request: HttpRequest) -> HttpResponse:
    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/management.html', {'json_data': [], 'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(user, reverse("dashboard:management_workzone"))})

@login_required()
@permission_required('menupermissions.x_management_plannings')
@require_http_methods(['GET'])
def plannings_management(request: HttpRequest) -> HttpResponse:
    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/management.html', {'json_data': [], 'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(user, reverse("dashboard:management_planning"))})

@login_required()
@permission_required('menupermissions.x_management_users')
@require_http_methods(['GET'])
def users_management(request: HttpRequest) -> HttpResponse:
    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/management.html', {'json_data': [], 'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(user, reverse("dashboard:management_user"))})

@login_required()
@permission_required('menupermissions.x_management_villages')
@require_http_methods(['GET'])
def villages_management(request: HttpRequest) -> HttpResponse:
    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/management.html', {'json_data': [], 'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(user, reverse("dashboard:management_village"))})

@login_required()
@permission_required('menupermissions.x_locator')
@require_http_methods(['GET'])
def locator(request: HttpRequest) -> HttpResponse:
    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/locator.html', {'STATIC_URL': settings.STATIC_URL, 'menu': get_menu(user, reverse("dashboard:locator_list"))})

@login_required()
@permission_required('menupermissions.x_vectorcontrol')
@require_http_methods(['GET'])
def vector(request: HttpRequest) -> HttpResponse:
    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/vector.html', {'menu': get_menu(user, reverse("dashboard:vector"))})

@login_required()
@permission_required('menupermissions.x_qualitycontrol')
@require_http_methods(['GET'])
def quality_control(request: HttpRequest) -> HttpResponse:
    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/quality_control.html', {'test_count': range(1,7), 'menu': get_menu(user, reverse("dashboard:quality-control"))})


@login_required()
@permission_required('menupermissions.x_case_cases')
@require_http_methods(['GET'])
def cases_list(request: HttpRequest) -> HttpResponse:
    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/datas.html', {'menu': get_menu(user, reverse("dashboard:cases_list"))})


@login_required()
@permission_required('menupermissions.x_case_cases')
@require_http_methods(['GET'])
def register(request: HttpRequest) -> HttpResponse:
    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/datas.html', {'menu': get_menu(user, reverse("dashboard:register"))})

@login_required()
@permission_required('menupermissions.x_case_cases')
@require_http_methods(['GET'])
def register_detail(request: HttpRequest) -> HttpResponse:
    user = request.user

    if user.profile.password_reset:
        return redirect('/dashboard/password')
    else:
        return render(request, 'dashboard/datas.html', {'menu': get_menu(user, reverse("dashboard:register"))})
