import typing
from rest_framework import serializers, permissions, parsers
from rest_framework.authentication import BasicAuthentication

from iaso.models import Form, FormVersion
from .common import ModelViewSet, TimestampField
from .auth.authentication import CsrfExemptSessionAuthentication
from .forms import HasFormPermission


class FormVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormVersion
        fields = ['id', 'version_id', 'form_id', 'file', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    form_id = serializers.PrimaryKeyRelatedField(source="form", write_only=True, queryset=Form.objects.all())
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def validate(self, data: typing.Mapping):
        # validate form (access check)
        permission_checker = HasFormPermission()
        if not permission_checker.has_object_permission(self.context["request"], self.context["view"], data["form"]):
            raise serializers.ValidationError({"form_id": "Invalid form id"})

        return data


class FormVersionsViewSet(ModelViewSet):
    """Form versions API: /api/formversions/"""

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = FormVersionSerializer
    results_key = "formversions"
    queryset = FormVersion.objects.all()
    parser_classes = (parsers.MultiPartParser,)
    http_method_names = ('post',)

    def get_queryset(self):
        profile = self.request.user.iaso_profile

        return FormVersion.objects.filter(projects__account=profile.account)
