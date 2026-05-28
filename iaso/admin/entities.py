from django.contrib.gis import admin
from django.http import HttpResponseRedirect
from django.urls import reverse

from hat.audit.models import DJANGO_ADMIN
from iaso.admin.utils import (
    DuplicateUUIDFilter,
    EntityEmptyAttributesFilter,
    admin_attr_decorator,
    has_relation_filter_factory,
)
from iaso.models import Entity, EntityType


@admin.register(Entity)
@admin_attr_decorator
class EntityAdmin(admin.ModelAdmin):
    search_fields = [
        "id",
        "uuid",
        "account__name",
        "entity_type__name",
        "attributes__json",
        "attributes__id",
        "attributes__uuid",
    ]

    def get_form(self, request, obj=None, **kwargs):
        # In the <select> for the entity type, we also want to indicate the account name
        form = super().get_form(request, obj, **kwargs)
        form.base_fields["entity_type"].label_from_instance = lambda entity: (
            f"{entity.name} (Account: {entity.account.name})"
        )
        return form

    readonly_fields = ("created_at",)
    list_display = (
        "id",
        "uuid",
        "entity_type",
        "name",
        "account",
        "deleted_at",
        "merged_to",
    )
    list_filter = (
        "account",
        "entity_type",
        "deleted_at",
        has_relation_filter_factory("Attributes ID", "attributes_id"),
        EntityEmptyAttributesFilter,
        DuplicateUUIDFilter,
    )
    raw_id_fields = ("attributes", "merged_to")

    def get_queryset(self, request):
        return Entity.objects_include_deleted.all()

    # Don't allow delete multiple to avoid deletes without side-effects and audit log
    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions

    # Override the Django admin delete action to do a proper soft-deletion
    def delete_view(self, request, object_id, extra_context=None):
        entity = Entity.objects_include_deleted.get(pk=object_id)

        entity.soft_delete_with_instances_and_pending_duplicates(
            audit_source=DJANGO_ADMIN,
            user=request.user,
        )

        msg = f"Entity {entity.uuid} was soft deleted, along with its instances and pending duplicates"
        self.message_user(request, msg)

        # redirect to the list view
        return HttpResponseRedirect(reverse("admin:iaso_entity_changelist"))


@admin.register(EntityType)
@admin_attr_decorator
class EntityTypeAdmin(admin.ModelAdmin):
    readonly_fields = ("created_at",)
    list_display = (
        "id",
        "name",
        "account",
    )
