from django.db import models


def get_default_whitelist():
    return dict(fields=[])


class PublicRegistryConfig(models.Model):
    host = models.URLField(unique=True)
    slug = models.SlugField(unique=True)
    whitelist = models.JSONField(default=get_default_whitelist)
    account = models.ForeignKey("iaso.Account", on_delete=models.CASCADE)
    root_orgunit = models.ForeignKey("iaso.OrgUnit", on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.slug
