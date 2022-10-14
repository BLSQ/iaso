from django.shortcuts import get_object_or_404, render, resolve_url

from django.contrib.auth.views import redirect_to_login
from django.conf import settings
from iaso.models import Page, Account, TEXT, IFRAME, POWERBI

from hat.__version__ import DEPLOYED_ON, DEPLOYED_BY, VERSION
from iaso.utils.powerbi import get_powerbi_report_token
from django.http import HttpResponse, JsonResponse


def load_powerbi_config_for_page(page):
    group_id = page.powerbi_group_id
    report_id = page.powerbi_report_id
    filters = page.powerbi_filters

    report_access_token = get_powerbi_report_token(group_id, report_id)
    config = {"token": report_access_token, "report_id": report_id, group_id: "group_id", "filters": filters}
    return config


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
