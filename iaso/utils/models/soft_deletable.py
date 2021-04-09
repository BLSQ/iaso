from django.db import models
from django.db.models.functions import Now

class SoftDeletableManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at=None)

class DeletedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=False)

class SoftDeletableModel(models.Model):
    deleted_at = models.DateTimeField(default=None, blank=True, null=True)

    deleted = DeletedManager()

    class Meta:
        abstract = True

    def delete_hard(self, using=None, keep_parents=False):
        return super().delete(using, keep_parents)

    def delete(self, using=None, keep_parents=False):
        self.deleted_at = Now()
        self.save()

    def restore(self):
        self.deleted_at = None
        self.save()