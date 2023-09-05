from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _
from django_comments.abstracts import CommentAbstractModel  # type: ignore


class CommentIaso(CommentAbstractModel):
    """Allow user to leave comment on orgunit

    For now
     * we only allow comment on orgunit
     * any user that has access to orgunit can comment on them
     * any user that has access to orgunit can view the comments on them
     * comment can be nested but only one level depth
    These restriction are enforced at the API level
    """

    parent = models.ForeignKey("self", on_delete=models.CASCADE, related_name="children", null=True, db_index=True)
    content_type = models.ForeignKey(
        ContentType,
        verbose_name=_("content type"),
        related_name="content_type_set_for_%(class)s2",
        on_delete=models.CASCADE,
        limit_choices_to={"model": "orgunit"},
    )
