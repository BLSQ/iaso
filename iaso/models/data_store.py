from django.db import models
from iaso.models import Account, OrgUnit

"""
Store data in JSON format. 

The typical use case is when we need to store data that is computed outside of iaso, then retrieve it and serve it to the front-end.


"""


class JsonDataStore(models.Model):
    slug = models.SlugField()
    content = models.JSONField()
    account = models.ForeignKey(Account, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    org_unit = models.ForeignKey(
        OrgUnit,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
    )

    class Meta:
        unique_together = ["slug", "account", "org_unit"]

    def __str__(self):
        return f"ID #{self.id} - Account #{self.account_id} - Org unit #{self.org_unit_id} - {self.slug}"
