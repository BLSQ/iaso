import typing

from django.contrib.auth.models import User
from django.http import HttpRequest
from rest_framework.request import Request
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.fields import JSONField
from django.db import models


class BulkOperationManager(models.Manager):
    def create_for_model_and_request(
        self,
        model: models.Model,
        request: typing.Union[HttpRequest, Request],
        *,
        operation_type: str,
        operation_count: int,
    ):
        json_body = request.data if isinstance(request, Request) else request.POST

        return self.create(
            content_type=ContentType.objects.get_for_model(model),
            json_body=json_body,
            user=request.user,
            operation_type=operation_type,
            operation_count=operation_count,
        )

    def create_for_model_and_params(
        self,
        model: models.Model,
        user: User,
        params: dict,
        *,
        operation_type: str,
        operation_count: int,
    ):
        return self.create(
            content_type=ContentType.objects.get_for_model(model),
            json_body=params,
            user=user,
            operation_type=operation_type,
            operation_count=operation_count,
        )


class BulkOperation(models.Model):
    OPERATION_TYPE_UPDATE = "UPDATE"
    OPERATION_TYPE_CHOICES = [(OPERATION_TYPE_UPDATE, _("Update"))]

    content_type = models.ForeignKey(ContentType, on_delete=models.PROTECT)
    operation_type = models.CharField(max_length=100, choices=OPERATION_TYPE_CHOICES)
    operation_count = models.PositiveIntegerField()
    json_body = JSONField()
    user = models.ForeignKey(get_user_model(), on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = BulkOperationManager()

    def __str__(self):
        return f"{self.content_type} - {self.pk}"

    class Meta:
        db_table = "iaso_operation_bulkupdate"
