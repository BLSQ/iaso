from datetime import datetime
from django.shortcuts import redirect
from django.urls import reverse
from functools import wraps

def is_user_authorized(view_func):
    def _decorator(request, *args, **kwargs):
        user = request.user
        if user.is_anonymous:
            return redirect('/dashboard/home')
        else:
            if user.profile.password_reset:
                return redirect('/dashboard/password')
            else:
                return view_func(request, *args, **kwargs)
    return wraps(view_func)(_decorator)

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
            "url_key": reverse("dashboard:epidemiology"),
            "items": [
                {
                    "name": "Epidémiologie",
                    "url_key": reverse("dashboard:epidemiology"),
                    "perms": "x_stats_graphs"
                },
                {
                    "name": "Monitorage de données",
                    "url_key": reverse("dashboard:datas_monitoring"),
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
                    "name": "Doublons",
                    "url_key": reverse("dashboard:register_duplicates"),
                    "perms": "x_case_cases"
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
            "items": [
                {
                    "name": "Carte",
                    "url_key": reverse("dashboard:vector"),
                    "perms": "x_vectorcontrol"
                },
                {
                    "name": "Synchronisation",
                    "url_key": reverse("dashboard:vector_sync"),
                    "perms": "x_vectorcontrol"
                },
                {
                    "name": "Import GPX",
                    "url_key": reverse("dashboard:vector_upload"),
                    "perms": "x_vectorcontrolupload"
                },
            ],
            "perms": None
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
