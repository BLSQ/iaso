from django.shortcuts import get_object_or_404, render
from django.contrib.auth.decorators import resolve_url
from django.contrib.auth.views import redirect_to_login
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from iaso.models import Page, Account, TEXT, IFRAME, POWERBI

from hat.__version__ import DEPLOYED_ON, DEPLOYED_BY, VERSION


def page(request, page_slug):
    page = get_object_or_404(Page, slug=page_slug)
    path = request.get_full_path()
    resolved_login_url = resolve_url(settings.LOGIN_URL)
    if page.needs_authentication and ((not request.user.is_authenticated) or (request.user not in page.users.all())):
        return redirect_to_login(path, resolved_login_url, "next")
    if page.type == IFRAME:
        return render(request, "iaso/pages/iframe.html", {"src": page.content, "title": page.name})
    if page.type == TEXT:
        return render(request, "iaso/pages/text.html", {"text": page.content, "title": page.name})
    if page.type == POWERBI:
        config = load_powerbi_config_for_page(page)
        return render(request, "iaso/pages/powerbi.html", {"config": config, "title": page.name})

    return HttpResponse(page.content)


import requests

SP_AUTH_URL = "https://login.microsoftonline.com/{tenant_id}/oauth2/token"
POWERBI_RESOURCE = "https://analysis.windows.net/powerbi/api"
GRANT_TYPE = "client_credentials"


def get_powerbi_service_principal_token(tenant_id, client_id, secret_value):
    body = {
        "grant_type": GRANT_TYPE,
        "resource": POWERBI_RESOURCE,
        "client_id": client_id,
        "client_secret": secret_value,
    }
    r = requests.post(url=SP_AUTH_URL.format(tenant_id=tenant_id), data=body)
    r.raise_for_status()
    access_token = r.json()["access_token"]
    return access_token


def get_powerbi_report_token_with_sp(sp_access_token, group_id, report_id):
    body = {"accessLevel": "View"}
    url = "https://api.powerbi.com/v1.0/myorg/groups/%s/reports/%s/GenerateToken" % (group_id, report_id)
    headers = {"Content-Type": "application/json", "Authorization": "Bearer %s" % sp_access_token}
    r = requests.post(url=url, json=body, headers=headers)
    r.raise_for_status()
    report_token = r.json()["token"]
    return report_token


def get_powerbi_report_token(group_id, report_id):
    # FIXME : import is not extra but will do till we move this model
    from plugins.polio.models import Config

    conf = get_object_or_404(Config, slug="powerbi_sp")
    config = conf.content

    sp_access_token = get_powerbi_service_principal_token(
        config["tenant_id"], config["client_id"], config["secret_value"]
    )
    return get_powerbi_report_token_with_sp(sp_access_token, group_id, report_id)


def load_powerbi_config_for_page(page):
    group_id = page.powerbi_group_id
    report_id = page.powerbi_report_id
    filters = page.powerbi_filters

    report_access_token = get_powerbi_report_token(group_id, report_id)
    config = {"token": report_access_token, "report_id": report_id, group_id: "group_id", "filters": filters}
    return config


def health(request):
    """This is used by aws health check to verify the environment is up

    it just looks at the 200 status code and not at the content.
    """
    res = {
        "up": "ok",
        "env": settings.ENVIRONMENT,
        "database": settings.DATABASES["default"]["NAME"],
        "DEPLOYED_ON": DEPLOYED_ON,
        "DEPLOYED_BY": DEPLOYED_BY,
        "VERSION": VERSION,
    }
    # noinspection PyBroadException
    try:
        # mostly to check we can connect to the db
        res["account_count"] = Account.objects.count()
    except:
        res["error"] = "db_fail"

    return JsonResponse(res)
