from django.db import models
from django.utils.timezone import now


class DefaultSoftDeletableManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at=None)


class IncludeDeletedSoftDeletableManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset()


class OnlyDeletedSoftDeletableManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=False)


class SoftDeletableModel(models.Model):
    class Meta:
        abstract = True

    deleted_at = models.DateTimeField(default=None, blank=True, null=True)

    def delete_hard(self, using=None, keep_parents=False):
        return super().delete(using, keep_parents)

    def delete(self, using=None, keep_parents=False):
        self.deleted_at = now()
        self.save()

    def restore(self):
        self.deleted_at = None
        self.save()
