from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required, resolve_url
from django.contrib.auth.views import redirect_to_login
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from iaso.models import Page, Account


@login_required
def page(request, page_slug):
    page = get_object_or_404(Page, slug=page_slug)
    if request.user not in page.users.all():
        path = request.get_full_path()
        resolved_login_url = resolve_url(settings.LOGIN_URL)
        return redirect_to_login(path, resolved_login_url, "next")

    return HttpResponse(page.content)


def health(request):
    """This is used by aws health check to verify the environment is up

    it just looks at the 200 status code and not at the content.
    """
    res = {"up": "ok", "env": settings.ENVIRONMENT}
    try:
        # mostly to check we can connect to the db
        res["account_count"] = Account.objects.count()
    except:
        res["error"] = "db_fail"

    return JsonResponse(res)
