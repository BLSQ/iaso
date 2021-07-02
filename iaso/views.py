from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required, resolve_url
from django.contrib.auth.views import redirect_to_login
from django.http import HttpResponse
from django.conf import settings
from iaso.models import Page


@login_required
def page(request, page_slug):
    page = get_object_or_404(Page, slug=page_slug)
    if request.user not in page.users.all():
        path = request.get_full_path()
        resolved_login_url = resolve_url(settings.LOGIN_URL)
        return redirect_to_login(path, resolved_login_url, "next")

    return HttpResponse(page.content)
