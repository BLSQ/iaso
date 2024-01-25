from django.contrib.auth.models import User
from django.db import models


class Config(models.Model):
    """A json that can be used to store configs that we want to be able to change without having to deploy,
    e.g: url to a 3rd party server.

    It's meant to be accessed mainly by iaso's backend but it can be exposed by an API. In that case, access not granted
    via permissions but on a user basis, with the `users` field.

    The slug acts identifier and can be used to generate the API url
    """

    slug = models.SlugField(unique=True)
    content = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    users = models.ManyToManyField(User, related_name="jsonconfigs", blank=True)

    def __str__(self):
        return self.slug
