from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse

from iaso.models import Page


@login_required
def page(request, page_slug):
    page = get_object_or_404(Page, slug=page_slug)
    if request.user not in page.users.all():
        return HttpResponse("unauthorized", 409)
    return HttpResponse(page.content)
