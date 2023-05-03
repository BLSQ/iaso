from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.models import ContentType
from django.contrib.sites.models import Site
from django.utils.encoding import smart_str
from django.utils.translation import ugettext_lazy as _
from rest_framework import serializers, mixins, permissions
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.relations import RelatedField
from rest_framework.viewsets import GenericViewSet

from iaso.api.common import UserSerializer
from iaso.models import OrgUnit
from iaso.models.comment import CommentIaso


class ContentTypeField(RelatedField):
    """A read-write field that represents a content_type.

    Based on SlugRelatedField
    """

    default_error_messages = {
        "does_not_exist": _("Model {value} does not exist."),
        "invalid": _("Invalid value."),
    }

    def to_internal_value(self, data):
        try:
            app_label, model = data.split("-")

            return ContentType.objects.get_by_natural_key(app_label, model)
        except ContentType.DoesNotExist:
            self.fail("does_not_exist", value=smart_str(data))
        except (TypeError, ValueError, AttributeError):
            self.fail("invalid")

    def to_representation(self, obj: ContentType):
        return f"{obj.app_label}-{obj.model}"


class UserSerializerForComment(UserSerializer):
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["id"]
        ref_name = "comment_user_serializer"


class CommentMiniSerializer(serializers.ModelSerializer):
    """Without the children"""

    class Meta:
        model = CommentIaso
        fields = ["id", "user", "comment", "content_type", "object_pk", "site", "submit_date"]
        read_only_fields = ["user"]

    user = UserSerializerForComment(read_only=True)
    content_type = ContentTypeField(queryset=ContentType.objects.filter(model="orgunit"))


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentIaso
        fields = ["id", "parent", "user", "comment", "children", "content_type", "object_pk", "site", "submit_date"]
        read_only_fields = ["user", "children", "site"]

    children = CommentMiniSerializer(many=True, read_only=True)
    user = UserSerializerForComment(read_only=True)
    content_type = ContentTypeField(queryset=ContentType.objects.filter(model="orgunit"))

    def validate(self, attrs):
        if not attrs["content_type"].model_class() == OrgUnit:
            raise ValidationError("only comment on OrgUnit are accepted for now")

        # can comment on an orgunit if we have access to it
        try:
            OrgUnit.objects.filter_for_user_and_app_id(self.context["request"].user).get(pk=attrs["object_pk"])
        except OrgUnit.DoesNotExist:
            raise PermissionDenied("User cannot leave comment on this OrgUnit")

        if attrs.get("parent"):
            parent = attrs["parent"]
            if parent.parent:
                raise ValidationError("Only one depth of commenting")
            if parent.object_pk != attrs["object_pk"] and parent.content_type == attrs["content_type"]:
                raise ValidationError("Children comment must be the same object as their parent")
        return attrs


class CommentViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, GenericViewSet):
    """Comment API

    This API allow letting comment on orgunit and viewing comment other users left on them.
    Only comment on OrgUnit are allowed at the moment.
    Threaded comment are allowed 1 level deep by specifying the parent

    GET /api/comment/?object_pk=<>&content_type=iaso-orgunit
    POST /api/comment/
    """

    queryset = CommentIaso.objects.all()
    serializer_class = CommentSerializer
    pagination_class = LimitOffsetPagination
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self, **kwargs):
        # all comment for an object_id and content type (won't return anything if you don't specify theses)
        # inspired from django-comments-xtf

        content_type_arg = self.request.query_params.get("content_type", "-")
        object_pk_arg = self.request.query_params.get("object_pk", None)
        app_label, model = content_type_arg.split("-")
        try:
            content_type = ContentType.objects.get_by_natural_key(app_label, model)
        except ContentType.DoesNotExist:
            return CommentIaso.objects.none()

        try:
            OrgUnit.objects.filter_for_user_and_app_id(self.request.user).get(pk=object_pk_arg)
        except OrgUnit.DoesNotExist:
            return CommentIaso.objects.none()

        qs = CommentIaso.objects.filter(
            content_type=content_type,
            object_pk=object_pk_arg,
            is_public=True,
            parent=None,  # we only want the root object, the other will be retrieved from children
        ).prefetch_related("children")

        return qs

    def perform_create(self, serializer):
        # django-contrib-comment want to play with contrib.sites
        site = Site.objects.first()
        serializer.save(user=self.request.user, site=site)
