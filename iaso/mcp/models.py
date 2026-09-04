from django.conf import settings
from django.db import models


class ToolCall(models.Model):
    """Audit log of MCP tool invocations (no secrets)."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mcp_tool_calls")
    tool_name = models.CharField(max_length=255, db_index=True)
    arguments = models.JSONField(default=dict)
    success = models.BooleanField()
    error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.tool_name} by {self.user_id} ({self.created_at})"
