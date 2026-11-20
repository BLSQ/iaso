"""
Models for iaso/tests/utils/models/test_soft_deletable
"""

from django.db import models

from iaso.utils.models.soft_deletable import (
    DefaultSoftDeletableManager,
    IncludeDeletedSoftDeletableManager,
    OnlyDeletedSoftDeletableManager,
    SoftDeletableModel,
)


class TestSoftDeletableModel(SoftDeletableModel):
    name = models.CharField(max_length=100)
    objects = DefaultSoftDeletableManager()
    objects_only_deleted = OnlyDeletedSoftDeletableManager()
    objects_include_deleted = IncludeDeletedSoftDeletableManager()
