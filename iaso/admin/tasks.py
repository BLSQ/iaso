from django.contrib import messages
from django.contrib.gis import admin
from django.db import models
from django.utils.html import format_html
from lazy_services import LazyService

from iaso.admin.utils import IasoJSONEditorWidget, admin_attr_decorator
from iaso.models import ERRORED, QUEUED, Task, TaskLog


task_service = LazyService("BACKGROUND_TASK_SERVICE")


@admin.action(description="Relaunch selected tasks")
def relaunch_task(_, request, queryset) -> None:
    task_to_relaunch = queryset.filter(status=ERRORED)

    for task in task_to_relaunch:
        task.status = QUEUED
        task.launcher = request.user
        task.save()
        task.queue_answer = task_service.enqueue(
            module_name=task.params["module"],
            method_name=task.params["method"],
            args=task.params["args"],
            kwargs=task.params["kwargs"],
            task_id=task.id,
        )
        task.save()

    messages.success(request, f"{task_to_relaunch.count()} task successfully relaunched.")


@admin.register(Task)
@admin_attr_decorator
class TaskAdmin(admin.ModelAdmin):
    list_display = ("name", "account", "status", "created_at", "launcher", "result_message", "result")
    list_filter = ("account", "status", "name")
    readonly_fields = ("stacktrace", "created_at")
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
    search_fields = ("name",)
    autocomplete_fields = ("account", "created_by", "launcher")
    date_hierarchy = "created_at"
    actions = (relaunch_task,)

    def result_message(self, task):
        return task.result and task.result.get("message", "")

    def stacktrace(self, task):
        if not task.result:
            return None
        stack = task.result.get("stack_trace")
        return format_html("<p>{}</p><pre>{}</pre>", task.result.get("message", ""), stack)

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("launcher")


@admin.register(TaskLog)
class TaskLogAdmin(admin.ModelAdmin):
    list_display = ("task", "created_at", "message")
    list_filter = ["task"]
    readonly_fields = ["created_at"]
