from django.contrib.gis import admin

from iaso.admin.utils import admin_attr_decorator
from iaso.models import OrgUnit, OrgUnitChangeRequest, OrgUnitReferenceInstance


class OrgUnitReferenceInstanceInline(admin.TabularInline):
    model = OrgUnitReferenceInstance
    extra = 0
    raw_id_fields = (
        "form",
        "instance",
    )
    can_delete = True

    def has_add_permission(self, request, obj=None):
        return True


@admin.register(OrgUnit)
@admin_attr_decorator
class OrgUnitAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("parent", "reference_instances", "default_image")
    autocomplete_fields = ("creator", "org_unit_type", "version")
    list_filter = (
        "org_unit_type",
        "custom",
        "validation_status",
        "sub_source",
        "version__data_source",
        "version__data_source__projects__account",
    )
    search_fields = ("name", "source_ref", "uuid")
    readonly_fields = ("path",)
    inlines = [
        OrgUnitReferenceInstanceInline,
    ]
    list_display = (
        "id",
        "org_unit_type",
        "name",
        "uuid",
        "parent",
        "version",
        "get_account_names",
    )

    @admin.display(description="Accounts")
    def get_account_names(self, obj):
        accounts = set(
            f"{project.account.name} ({project.account.id})" for project in obj.version.data_source.projects.all()
        )
        return ", ".join(sorted(accounts)) if accounts else "-"

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("org_unit_type", "parent", "version", "version__data_source").prefetch_related(
            "version__data_source__projects__account"
        )


@admin.register(OrgUnitChangeRequest)
class OrgUnitChangeRequestAdmin(admin.ModelAdmin):
    list_display = ("pk", "org_unit", "created_at", "status", "deleted_at")
    list_display_links = ("pk", "org_unit")
    list_filter = ("status", "kind", "data_source_synchronization", "deleted_at")
    readonly_fields = (
        "uuid",
        "created_at",
        "created_by",
        "updated_at",
        "updated_by",
        "old_parent",
        "old_name",
        "old_org_unit_type",
        "old_groups",
        "old_location",
        "old_reference_instances",
        "old_opening_date",
        "old_closed_date",
        "potential_payment",
    )
    raw_id_fields = (
        "org_unit",
        "new_parent",
        "new_org_unit_type",
        "new_groups",
        "new_reference_instances",
        "payment",
        "potential_payment",
        "data_source_synchronization",
    )
    fieldsets = (
        (
            "Informations",
            {
                "fields": (
                    "uuid",
                    "org_unit",
                    "status",
                    "payment",
                    "potential_payment",
                )
            },
        ),
        (
            "Proposed changes",
            {
                "fields": (
                    "new_parent",
                    "new_name",
                    "new_org_unit_type",
                    "new_groups",
                    "new_location",
                    "new_location_accuracy",
                    "new_reference_instances",
                    "new_opening_date",
                    "new_closed_date",
                )
            },
        ),
        (
            "Changes",
            {
                "fields": (
                    "requested_fields",
                    "approved_fields",
                )
            },
        ),
        (
            "Metadata",
            {
                "fields": (
                    "kind",
                    "created_at",
                    "created_by",
                    "updated_at",
                    "updated_by",
                    "rejection_comment",
                    "data_source_synchronization",
                )
            },
        ),
        (
            "Old values",
            {
                "fields": (
                    "old_parent",
                    "old_name",
                    "old_org_unit_type",
                    "old_groups",
                    "old_location",
                    "old_reference_instances",
                    "old_opening_date",
                    "old_closed_date",
                )
            },
        ),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("org_unit__org_unit_type", "data_source_synchronization")
