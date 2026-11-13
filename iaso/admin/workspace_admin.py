from django.contrib import admin

from iaso.models import Workspace


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ("name", "account", "created_by", "created_at", "deleted_at")
    list_filter = ("account", ("deleted_at", admin.EmptyFieldListFilter))
    search_fields = ("name", "account__name")
    ordering = ("account__name", "name")
    autocomplete_fields = ("account", "source_workspace", "created_by")
    readonly_fields = ("created_at", "updated_at", "deleted_at")
    fields = ("account", "name", "description", "source_workspace", "created_by", *readonly_fields)

    def get_queryset(self, request):
        return Workspace.objects_include_deleted.select_related("account", "created_by")

    def has_delete_permission(self, request, obj=None):
        # A hard delete cascades through all the workspace's data and hits PROTECT foreign keys;
        # workspace deletion needs its own ordered task (not in the first version).
        return False

    def save_model(self, request, obj, form, change):
        if not change and obj.created_by is None:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
