from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.views import redirect_to_login
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, render, resolve_url

from hat.__version__ import DEPLOYED_BY, DEPLOYED_ON, VERSION
from iaso.models import IFRAME, POWERBI, TEXT, Account, Page
from iaso.utils.powerbi import get_powerbi_report_token


def load_powerbi_config_for_page(page: Page):
    group_id = page.powerbi_group_id
    report_id = page.powerbi_report_id
    filters = page.powerbi_filters
    language = page.powerbi_language

    report_access_token = get_powerbi_report_token(group_id, report_id)
    config = {
        "token": report_access_token,
        "report_id": report_id,
        "group_id": group_id,
        "language": language,
        "filters": filters,
    }
    return config


def page(request, page_slug):
    page = get_object_or_404(Page, slug=page_slug)
    path = request.get_full_path()
    resolved_login_url = resolve_url(settings.LOGIN_URL)
    if page.needs_authentication and ((not request.user.is_authenticated) or (request.user not in page.users.all())):
        return redirect_to_login(path, resolved_login_url, "next")
    if page.type == IFRAME:
        response = render(request, "iaso/pages/iframe.html", {"src": page.content, "title": page.name})
    elif page.type == TEXT:
        response = render(request, "iaso/pages/text.html", {"text": page.content, "title": page.name})
    elif page.type == POWERBI:
        config = load_powerbi_config_for_page(page)
        response = render(request, "iaso/pages/powerbi.html", {"config": config, "title": page.name})
    else:
        response = HttpResponse(page.content)
    response["X-Frame-Options"] = "ALLOW"
    return response


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
