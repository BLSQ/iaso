import json

from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.views import redirect_to_login
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, render, resolve_url
from django.views.decorators.csrf import csrf_exempt

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


@csrf_exempt
def task_launcher(request, task_name, user_name):
    try:
        the_user = User.objects.get(username=user_name)
    except User.DoesNotExist:
        return JsonResponse({"status": "fail", "error": f"User not found for {user_name}"})
    except Exception as e:
        return JsonResponse(
            {"status": "fail", "error": f"Error while loading user {user_name}", "error_details": str(e)}
        )

    try:
        import importlib

        task_parts = task_name.split(".")
        task_fn_str = task_parts.pop()
        task_module_str = ".".join(task_parts)

        task_module = importlib.import_module(task_module_str)
        the_task_fn = getattr(task_module, task_fn_str)

    except Exception as e:
        return JsonResponse(
            {
                "status": "fail",
                "error": f"Error while loading task {task_name} - {task_module_str} : {task_fn_str}",
                "error_details": str(e),
            }
        )

    try:
        call_args = {"user": the_user}
        if len(request.POST) > 0:
            call_args = {**call_args, **request.POST}

        if len(request.body) > 0:
            body_json = json.parse(request.body)
            call_args = {**call_args, **body_json}

        if len(request.GET) > 0:
            call_args = {**call_args, **request.GET}

        the_task = the_task_fn(**call_args)
        return JsonResponse({"status": "OK", "task": the_task.as_dict()})

    except Exception as e:
        return JsonResponse(
            {
                "status": "fail",
                "error": f"Error while launching the task {task_name} with call args {call_args}",
                "error_details": str(e),
            }
        )
