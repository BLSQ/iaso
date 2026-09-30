import json
import logging

import clamav_client

from bs4 import BeautifulSoup as Soup  # type: ignore
from django.conf import settings
from django.contrib.auth.views import redirect_to_login
from django.db import models
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, render, resolve_url
from django.template.loader import render_to_string
from django.urls import reverse
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.decorators.http import require_GET, require_POST

from iaso.models import IFRAME, POWERBI, SUPERSET, TEXT, Account, Page
from iaso.permissions.core_permissions import CORE_PAGE_WRITE_PERMISSION
from iaso.utils.page_pipeline import (
    PAGE_PIPELINE_ERROR_MESSAGES,
    PagePipelineError,
    account_has_openhexa_config,
    page_pipeline_has_failed,
    page_pipeline_is_ongoing,
    start_page_pipeline,
)
from iaso.utils.powerbi import get_powerbi_report_token


logger = logging.getLogger(__name__)


def load_powerbi_config_for_page(page: Page):
    group_id = page.powerbi_group_id
    report_id = page.powerbi_report_id
    filters = page.powerbi_filters
    language = page.language

    report_access_token = get_powerbi_report_token(group_id, report_id)
    config = {
        "token": report_access_token,
        "report_id": report_id,
        "group_id": group_id,
        "language": language,
        "filters": filters,
    }
    return config


@xframe_options_exempt
def page(request, page_slug):
    content = {}

    try:
        analytics_script = request.user.iaso_profile.account.analytics_script
    except AttributeError:
        analytics_script = None

    if analytics_script:
        content["analytics_script"] = analytics_script
    page = get_object_or_404(Page, slug=page_slug)
    path = request.get_full_path()
    resolved_login_url = resolve_url(settings.LOGIN_URL)
    if page.needs_authentication:
        if not request.user.is_authenticated:
            return redirect_to_login(path, resolved_login_url, "next")

        if not user_can_access_page(request.user, page):
            return redirect_to_login(path, resolved_login_url, "next")
    content["launch_pipeline"] = build_launch_pipeline_context(request, page)

    if page.type == IFRAME:
        content.update({"src": page.content, "title": page.name, "page": page})
        response = render(
            request,
            "iaso/pages/iframe.html",
            content,
        )
    elif page.type == TEXT:
        content.update(
            {
                "text": page.content,
                "title": page.name,
            }
        )
        response = render(
            request,
            "iaso/pages/text.html",
            content,
        )
    elif page.type == POWERBI:
        config = load_powerbi_config_for_page(page)
        content.update(
            {
                "config": config,
                "title": page.name,
                "page": page,
            }
        )

        response = render(
            request,
            "iaso/pages/powerbi.html",
            content,
        )
    elif page.type == SUPERSET:
        content.update(
            {
                "config": {
                    "superset_url": settings.SUPERSET_URL,
                    "dashboard_id": page.superset_dashboard_id,
                    "dashboard_ui_config": page.superset_dashboard_ui_config,
                },
                "title": page.name,
                "page": page,
            }
        )
        response = render(
            request,
            "iaso/pages/superset.html",
            content,
        )
    else:
        raw_html = page.content
        if analytics_script and raw_html is not None:
            raw_html = addTag(raw_html, analytics_script)
        response = HttpResponse(append_launch_pipeline_snippet(request, raw_html, content.get("launch_pipeline")))
    return response


def user_can_access_page(user, page):
    """Check if user has access to view this page."""

    # WRITE permission grants access to all pages in the account
    if user.has_perm(CORE_PAGE_WRITE_PERMISSION.full_name()):
        return page.account == user.iaso_profile.account

    # Check direct user assignment
    if user in page.users.all():
        return True

    # Check role-based assignment
    return page.user_roles.filter(group__in=user.groups.all()).exists()


def user_may_launch_page_pipeline(_user, page) -> bool:
    """True when the page has a pipeline and the account has an OpenHEXA workspace.

    There is no user check. Whoever can open the page sees the button.
    """
    if not page.pipeline_id or not page.account_id:
        return False
    return account_has_openhexa_config(page.account)


def build_launch_pipeline_context(request, page):
    if not user_may_launch_page_pipeline(request.user, page):
        return None
    messages = page.pipeline_status_messages()
    return {
        "button_text": page.pipeline_button_text(),
        "in_progress": messages["in_progress"],
        "finished": messages["finished"],
        "failed": messages["failed"],
        "error": messages["error"],
        "ongoing": page_pipeline_is_ongoing(page),
        "launch_url": reverse("page_launch_pipeline", kwargs={"page_slug": page.slug}),
        "status_url": reverse("page_pipeline_status", kwargs={"page_slug": page.slug}),
    }


def append_launch_pipeline_snippet(request, raw_html, launch_pipeline):
    html = "" if raw_html is None else str(raw_html)
    if not launch_pipeline:
        return html
    snippet = render_to_string(
        "iaso/pages/launch_pipeline_snippet.html",
        {"launch_pipeline": launch_pipeline},
        request=request,
    )
    closing = html.lower().rfind("</body>")
    if closing == -1:
        return html + snippet
    return html[:closing] + snippet + html[closing:]


def _pipeline_page_or_error(request, page_slug):
    page = get_object_or_404(Page.objects.select_related("account"), slug=page_slug)
    if not user_may_launch_page_pipeline(request.user, page):
        return None, JsonResponse({"error": "forbidden"}, status=403)
    return page, None


@require_GET
def page_pipeline_status(request, page_slug):
    page, error = _pipeline_page_or_error(request, page_slug)
    if error:
        return error
    return JsonResponse(
        {
            "ongoing": page_pipeline_is_ongoing(page),
            "failed": page_pipeline_has_failed(page),
        }
    )


@require_POST
def launch_page_pipeline(request, page_slug):
    page, error = _pipeline_page_or_error(request, page_slug)
    if error:
        return error
    if page_pipeline_is_ongoing(page):
        logger.info("Refresh already running for page %s", page_slug)
        return JsonResponse({"error": "The refresh could not be started.", "ongoing": True}, status=409)
    try:
        task = start_page_pipeline(request.user, page)
    except PagePipelineError as exc:
        logger.exception("Could not start the pipeline for page %s", page_slug)
        return JsonResponse(
            {"error": PAGE_PIPELINE_ERROR_MESSAGES.get(exc.code, "The refresh could not be started.")},
            status=exc.status_code,
        )
    return JsonResponse({"task": {"id": task.id, "status": task.status}, "ongoing": True}, status=201)


# Function to append analytics script in the head tag
def addTag(html, tagToAppend):
    soup = Soup(html, "html.parser")
    if not soup.head:
        head = soup.new_tag("head")
        if soup.html:
            soup.html.insert(1, head)
        else:
            soup.insert(1, head)
    soup.head.append(Soup(tagToAppend, "html.parser"))
    return soup


def health(request):
    """This is used by aws health check to verify the environment is up

    it just looks at the 200 status code and not at the content.
    """
    res = {
        "up": "ok",
        "env": settings.ENVIRONMENT,
        "database": settings.DATABASES["default"]["NAME"],
        "DEPLOYED_ON": settings.DEPLOYED_ON,
        "DEPLOYED_BY": settings.DEPLOYED_BY,
        "PROD_IMAGE_DIGEST": settings.PROD_IMAGE_DIGEST,
        "PROD_IMAGE_CREATION": settings.PROD_IMAGE_CREATION,
        "PROD_IMAGE_TAG": settings.PROD_IMAGE_TAG,
        "VERSION": settings.IASO_VERSION,
    }
    # noinspection PyBroadException
    try:
        # mostly to check we can connect to the db
        res["account_count"] = Account.objects.count()
    except:
        res["error"] = "db_fail"

    return JsonResponse(res)


def health_clamav(request):
    """This is used to check whether ClamAV is active on this Iaso instance and if the ClamAV server is reachable"""

    is_clamav_active = settings.CLAMAV_ACTIVE
    if not is_clamav_active:
        return JsonResponse({"active": False, "up": "?"})

    ping_config = {
        **settings.CLAMAV_CONFIGURATION,
        "timeout": float(2),
    }

    scanner = clamav_client.get_scanner(config=ping_config)
    res = {
        "active": True,
    }

    try:
        info = scanner.info()
        res["up"] = True
        res["version"] = info.version
        res["virus_definitions"] = info.virus_definitions
    except Exception:
        res["up"] = False

    return JsonResponse(res)


def robots_txt(request):
    content = """User-agent: *
Disallow: /"""
    return HttpResponse(content, content_type="text/plain")


import json

from django.contrib.contenttypes.fields import GenericForeignKey
from django.db import models
from django.http import HttpResponseForbidden
from django.shortcuts import render
from django.views import View

from iaso import models as iaso_models


class ModelDataView(View):
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return HttpResponseForbidden("authentication required")

        model_data = self.get_model_data()
        return render(request, "iaso/model_diagram.html", {"model_data": json.dumps(model_data)})

    def get_model_data(self):
        nodes = []
        links = []

        all_models = [
            getattr(iaso_models, name)
            for name in dir(iaso_models)
            if isinstance(getattr(iaso_models, name), type) and issubclass(getattr(iaso_models, name), models.Model)
        ]

        for model in all_models:
            node = {"id": model.__name__, "type": "model", "app": "iaso", "fields": []}

            for field in model._meta.get_fields():
                field_type = self.get_field_type(field)
                node["fields"].append({"name": field.name, "type": field_type})

                if isinstance(field, (models.ForeignKey, models.OneToOneField, models.ManyToManyField)):
                    related_model = field.related_model
                    if related_model in all_models:
                        links.append(
                            {"source": model.__name__, "target": related_model.__name__, "type": type(field).__name__}
                        )

            nodes.append(node)

        return {"nodes": nodes, "links": links}

    def get_field_type(self, field):
        if isinstance(field, models.ForeignKey):
            return f"ForeignKey to {field.related_model.__name__}"
        if isinstance(field, models.ManyToManyField):
            return f"ManyToManyField to {field.related_model.__name__}"
        if isinstance(field, models.OneToOneField):
            return f"OneToOneField to {field.related_model.__name__}"
        if isinstance(field, GenericForeignKey):
            return "GenericForeignKey"
        return field.__class__.__name__
