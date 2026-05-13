from autoslug import AutoSlugField
from autoslug.utils import crop_slug, get_prepopulated_value
from django.db import models
from django.utils.translation import gettext_lazy as _


class CreatedAndUpdatedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ValidationWorkflowArtefactStatus(models.TextChoices):
    APPROVED = "APPROVED", _("Approved")
    REJECTED = "REJECTED", _("Rejected")
    PENDING = "PENDING", _("Pending")


class ValidationWorkflowArtefact(models.Model):
    general_validation_status = models.CharField(
        choices=ValidationWorkflowArtefactStatus.choices, blank=True, default="", max_length=20
    )

    class Meta:
        abstract = True

    def has_workflow(self, workflow):
        return self.validationnode_set.filter(node__workflow=workflow).exists()

    def get_next_pending_nodes(self, workflow=None):
        from iaso.models.validation_workflow.validation_node import ValidationNodeStatus

        return self.validationnode_set.filter(
            status=ValidationNodeStatus.UNKNOWN, **{"node__workflow": workflow} if workflow else {}
        )

    def get_all_validation_nodes(self, workflow=None):
        """
        Function to recursively get all validation nodes and order them
        """
        from iaso.models import ValidationNode

        return ValidationNode.objects.filter(
            instance_id=self.pk, **{"node__workflow": workflow} if workflow else {}
        ).order_by("-created_at")


class BulkAutoSlugField(AutoSlugField):
    def generate_slug_for_bulk_create(self, instance, existing_slugs=None):
        if existing_slugs is None:
            existing_slugs = set()

        value = self.value_from_object(instance)

        # autopopulate
        if self.always_update or (self.populate_from and not value):
            value = get_prepopulated_value(self, instance)

            # pragma: nocover
            if __debug__ and not value and not self.blank:
                print(
                    "Failed to populate slug %s.%s from %s"
                    % (instance._meta.object_name, self.name, self.populate_from)
                )

        slug = None
        if value:
            slug = self.slugify(value)
        if not slug:
            slug = None

            if not self.blank:
                slug = instance._meta.model_name
            elif not self.null:
                slug = ""

        if slug:
            slug = self.slugify(crop_slug(self, slug))

        # ensure the slug is unique
        if self.unique or self.unique_with:
            base_slug = slug
            i = 1
            while slug in existing_slugs:
                slug = f"{base_slug}-{i}"
                i += 1
        return slug
