from django.db import models


class TestNestedModel(models.Model):
    name = models.CharField(max_length=100, unique=True)


class OtherTestNestedModel(models.Model):
    name = models.CharField(max_length=100, unique=True)


class TestModelForListQueryOptimizedSerializer(models.Model):
    nested = models.ForeignKey(TestNestedModel, on_delete=models.CASCADE, null=True, blank=True)
    many_nested = models.ManyToManyField(OtherTestNestedModel)
