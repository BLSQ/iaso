from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import ugettext_lazy as _

RAW = "RAW"
TEXT = "TEXT"
IFRAME = "IFRAME"

PAGES_TYPES = [
    (RAW, _("Raw html")),
    (TEXT, _("Text")),
    (IFRAME, _("Iframe")),
]


class Page(models.Model):
    """A page for embedding content linked to a specific user"""

    name = models.TextField(null=False, blank=False)
    content = models.TextField(null=True, blank=True)
    users = models.ManyToManyField(User, related_name="pages", blank=True)
    needs_authentication = models.BooleanField(default=True)
    slug = models.SlugField(max_length=1000, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    type = models.CharField(
        max_length=40,
        choices=PAGES_TYPES,
        null=False,
        blank=False,
        default=RAW,
    )

    def __str__(self):
        return "%s " % (self.name,)
