from django.contrib.auth.models import User
from django.db import models


class Config(models.Model):
    slug = models.SlugField(unique=True)
    content = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    users = models.ManyToManyField(User, related_name="jsonconfigs", blank=True)

    def __str__(self):
        return self.slug
