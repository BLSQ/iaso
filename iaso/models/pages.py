from django.contrib.auth.models import User
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

PIPELINE_STATUS_MESSAGES = {
    "en": {
        "default_button": "Launch refresh",
        "in_progress": "Refresh in progress. This can take a few minutes. Reload the page when it is done.",
        "finished": "Refresh finished. Reload the page to see the latest data.",
        "error": "The refresh could not be started. Try again.",
    },
    "fr": {
        "default_button": "Lancer l'actualisation",
        "in_progress": "Actualisation en cours. Cela peut prendre quelques minutes. Rechargez la page une fois terminée.",
        "finished": "Actualisation terminée. Rechargez la page pour voir les dernières données.",
        "error": "L'actualisation n'a pas pu démarrer. Réessayez.",
    },
}


class Page(models.Model):
    """A page for embedding content linked to a specific user"""

    name = models.TextField(null=False, blank=False)
    content = models.TextField(null=True, blank=True)
    users = models.ManyToManyField(User, related_name="pages", blank=True)
    user_roles = models.ManyToManyField(UserRole, related_name="pages", blank=True)
    needs_authentication = models.BooleanField(default=True)
    slug = models.SlugField(max_length=1000, unique=True)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, blank=True, null=True)

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
    language = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Language and locale for this page, e.g. en, en-us or fr-be. Empty means English.",
    )

    superset_dashboard_id = models.TextField(blank=True, null=True)
    superset_dashboard_ui_config = models.JSONField(blank=True, null=True)

    additional_config = models.JSONField(
        blank=True,
        default=dict,
        help_text=(
            "Extra page configuration. Pipeline button: "
            '{"pipeline_config": {"pipeline_id": "<uuid>", "text": "Refresh the data"}}'
        ),
    )

    def __str__(self):
        return "%s " % (self.name,)

    @property
    def language_code(self) -> str:
        """Short language code from the page locale. Empty or unknown values use English."""
        raw = (self.language or "").strip().replace("_", "-")
        code = raw.split("-")[0].lower()
        return code or "en"

    def get_pipeline_config(self) -> dict:
        config = self.additional_config if isinstance(self.additional_config, dict) else {}
        pipeline_config = config.get("pipeline_config") or {}
        return pipeline_config if isinstance(pipeline_config, dict) else {}

    @property
    def pipeline_id(self) -> str:
        return str(self.get_pipeline_config().get("pipeline_id") or "").strip()

    def pipeline_status_messages(self) -> dict:
        return PIPELINE_STATUS_MESSAGES.get(self.language_code, PIPELINE_STATUS_MESSAGES["en"])

    def pipeline_button_text(self) -> str:
        text = self.get_pipeline_config().get("text") or ""
        if isinstance(text, str) and text.strip():
            return text.strip()
        return self.pipeline_status_messages()["default_button"]
