import pathlib

from iaso.models import Account
from iaso.utils import slugify_underscore
from iaso.utils.models.soft_deletable import SoftDeletableModel
from django.db import models


def _xls_form_template_upload_to(instance: "XlsFormTemplate", filename: str) -> str:
    path = pathlib.Path(filename)
    underscored_form_name = slugify_underscore(instance.name)

    return f"forms/{underscored_form_name}_{instance.id}{path.suffix}"


class XlsFormTemplate(SoftDeletableModel):
    form_template = models.FileField(upload_to=_xls_form_template_upload_to, null=True, blank=True)
    name = models.CharField(max_length=255, unique=True)
    account = models.ForeignKey(Account, blank=False, null=False, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["name", "account"]

    def __str__(self):
        return f"{self.account} {self.name}"

    def as_dict(self):
        return {
            "name": self.name,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "form_template": self.form_template,
            "account": self.account.as_dict(),
        }
