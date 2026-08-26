from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.translation import gettext_lazy as _

from iaso.models import Account, UserRole


RAW = "RAW"
TEXT = "TEXT"
IFRAME = "IFRAME"
POWERBI = "POWERBI"
SUPERSET = "SUPERSET"

PAGES_TYPES = [
    (RAW, _("Raw html")),
    (TEXT, _("Text")),
    (IFRAME, _("Iframe")),
    (POWERBI, _("PowerBI report")),
    (SUPERSET, _("Superset dashboard")),
]


class Page(models.Model):
    """A page for embedding content linked to a specific user"""

    name = models.TextField(null=False, blank=False)
    content = models.TextField(null=True, blank=True)
    users = models.ManyToManyField(User, related_name="pages", blank=True)
    user_roles = models.ManyToManyField(UserRole, related_name="pages", blank=True)
    needs_authentication = models.BooleanField(default=True)
    slug = models.SlugField(max_length=1000, unique=True)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, blank=True, null=True)
    embed_allowed_origins = ArrayField(
        models.CharField(max_length=255),
        default=list,
        blank=True,
        help_text="Origins allowed to embed this page in an <iframe>, in addition to this site itself "
        "(e.g. https://afro-rrt-who.hub.arcgis.com). Used to build the "
        "Content-Security-Policy: frame-ancestors header.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    type = models.CharField(
        max_length=40,
        choices=PAGES_TYPES,
        null=False,
        blank=False,
        default=RAW,
    )

    powerbi_group_id = models.TextField(blank=True, null=True)
    powerbi_report_id = models.TextField(blank=True, null=True)
    powerbi_dataset_id = models.TextField(blank=True, null=True)
    powerbi_filters = models.JSONField(blank=True, null=True)
    # see https://learn.microsoft.com/en-us/javascript/api/overview/powerbi/configure-report-settings#locale-settings
    powerbi_language = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Language and locale for the PowerBI embedded report e.g en-us or fr-be",
    )

    superset_dashboard_id = models.TextField(blank=True, null=True)
    superset_dashboard_ui_config = models.JSONField(blank=True, null=True)

    def __str__(self):
        return "%s " % (self.name,)
