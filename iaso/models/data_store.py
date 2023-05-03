from django.db import models
from iaso.models import Account

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

    class Meta:
        unique_together = ["slug", "account"]

    def __str__(self):
        return self.slug
