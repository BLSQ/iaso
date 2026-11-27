from django.db import models
from django.db.models.manager import Manager
from django.db.models.query import QuerySet
from django.utils.timezone import now
from typing_extensions import override


class BaseSoftDeletableQuerySet(QuerySet):
    def restore(self) -> int:
        return self.update(deleted_at=None)

    def delete_hard(self) -> tuple[int, dict[str, int]]:
        return super().delete()


class DefaultSoftDeletableQuerySet(BaseSoftDeletableQuerySet):
    @override
    def delete(self) -> int:
        return self.update(deleted_at=now())


class IncludeDeletedSoftDeletableQuerySet(DefaultSoftDeletableQuerySet):
    # just for naming purpose and ease for devs
    pass


class OnlyDeletedSoftDeletableQuerySet(BaseSoftDeletableQuerySet):
    # just for naming purpose and ease for devs
    pass


class DefaultSoftDeletableManager(Manager.from_queryset(DefaultSoftDeletableQuerySet)):
    def get_queryset(self) -> DefaultSoftDeletableQuerySet:
        return super().get_queryset().filter(deleted_at__isnull=True)


class IncludeDeletedSoftDeletableManager(Manager.from_queryset(IncludeDeletedSoftDeletableQuerySet)):
    pass


class OnlyDeletedSoftDeletableManager(Manager.from_queryset(OnlyDeletedSoftDeletableQuerySet)):
    def get_queryset(self) -> QuerySet:
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
