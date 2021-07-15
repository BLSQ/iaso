from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required, resolve_url
from django.contrib.auth.views import redirect_to_login
from django.http import HttpResponse
from django.conf import settings
from iaso.models import Page


def page(request, page_slug):
    page = get_object_or_404(Page, slug=page_slug)
    path = request.get_full_path()
    resolved_login_url = resolve_url(settings.LOGIN_URL)
    print()
    if page.needs_authentication and ((not request.user.is_authenticated) or (request.user not in page.users.all())):
        return redirect_to_login(path, resolved_login_url, "next")
    return HttpResponse(page.content)
