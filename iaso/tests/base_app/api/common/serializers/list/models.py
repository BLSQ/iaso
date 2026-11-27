"""
Models for api/common/test_serializers/test_list

"""

from django.db import models


class TestNestedModel(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self) -> str:
        return f"TestNestedModel {self.pk}"


class OtherTestNestedModel(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self) -> str:
        return f"OtherTestNestedModel {self.pk}"


class TestModelForListQueryOptimizedSerializer(models.Model):
    nested = models.ForeignKey(TestNestedModel, on_delete=models.CASCADE, null=True, blank=True)
    many_nested = models.ManyToManyField(OtherTestNestedModel)

    def __str__(self) -> str:
        return f"TestModelForListQueryOptimizedSerializer {self.pk}"
