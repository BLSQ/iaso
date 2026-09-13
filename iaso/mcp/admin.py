from django.contrib import admin

from iaso.mcp.models import ToolCall


@admin.register(ToolCall)
class ToolCallAdmin(admin.ModelAdmin):
    list_display = ("tool_name", "user", "success", "created_at")
    list_filter = ("success", "tool_name")
    search_fields = ("tool_name", "user__username", "error")
    readonly_fields = ("user", "tool_name", "arguments", "success", "error", "created_at")
