import logging

from django.contrib.auth.models import User
from rest_framework import permissions, serializers, routers
from rest_framework.permissions import SAFE_METHODS
from rest_framework.viewsets import ModelViewSet

from .models import BlogPost

logger = logging.getLogger(__name__)


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "username", "email"]


# noinspection PyMethodMayBeStatic
class BlogPostSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)

    class Meta:
        model = BlogPost
        fields = ["id", "title", "content", "author", "created_at"]
        read_only_fields = ["created_at", "author"]

    def validate_title(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Title must contain at least 3 characters")
        return value


class HasBlogPostPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj: BlogPost):
        print(request, view, obj)
        if not request.user.is_authenticated:
            return False

        # Everyone can read
        if request.method in SAFE_METHODS:
            return True
        else:
            # only an author can edit his post
            return obj.author == request.user


class BlogPostViewSet(ModelViewSet):
    """BlogPost API

    Authenticated user can read all post and create new one
    Only the original author can edit or delete his post

    GET /api/test/blogpost/
    GET /api/test/blogpost/<id>
    POST /api/test/blogpost/
    PATCH /api/test/blogpost/<id>
    DELETE /api/test/blogpost/<id>
    """

    permission_classes = [permissions.IsAuthenticated, HasBlogPostPermission]
    serializer_class = BlogPostSerializer
    queryset = BlogPost.objects.all()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


router = routers.SimpleRouter()
router.register(r"test/blogpost", BlogPostViewSet, basename="Campaign")
