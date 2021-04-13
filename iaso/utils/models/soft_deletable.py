from django.db import models
from django.db.models.functions import Now

class SoftDeletableQuerySet(models.QuerySet):
    def only_deleted(self):
        return self.filter(deleted_at__isnull=False)

class SoftDeletableManager(models.Manager):
    def get_queryset(self):
        return SoftDeletableQuerySet(self.model, using=self._db).filter(deleted_at=None)

    def only_deleted(self):
        return self.get_queryset().only_deleted()

    def include_deleted(self):
        return SoftDeletableQuerySet(self.model, using=self._db)

class SoftDeletableModel(models.Model):
    class Meta:
        abstract = True

    deleted_at = models.DateTimeField(default=None, blank=True, null=True)

    def delete_hard(self, using=None, keep_parents=False):
        return super().delete(using, keep_parents)

    def delete(self, using=None, keep_parents=False):
        self.deleted_at = Now()
        self.save()

    def restore(self):
        self.deleted_at = None
        self.save()