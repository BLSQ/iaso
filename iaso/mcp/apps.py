from django.apps import AppConfig


class McpConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "iaso.mcp"
    label = "mcp"
    verbose_name = "IASO MCP"
