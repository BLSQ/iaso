import typing
from django.db import transaction
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import serializers, permissions, parsers
from rest_framework.authentication import BasicAuthentication

from iaso.models import Form, FormVersion
from iaso.odk import parse_xls_form
from .common import ModelViewSet, TimestampField
from .auth.authentication import CsrfExemptSessionAuthentication
from .forms import HasFormPermission


class FormVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormVersion
        fields = ['id', 'version_id', 'form_id', 'xls_file', 'file', 'created_at', 'updated_at']
        read_only_fields = ['id', 'version_id', 'file', 'created_at', 'updated_at']

    form_id = serializers.PrimaryKeyRelatedField(source="form", write_only=True, queryset=Form.objects.all())
    xls_file = serializers.FileField(required=True, allow_empty_file=False)  # field is not required in model
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def validate(self, data: typing.Mapping):
        # validate form (access check)
        permission_checker = HasFormPermission()
        if not permission_checker.has_object_permission(self.context["request"], self.context["view"], data["form"]):
            raise serializers.ValidationError({"form_id": "Invalid form id"})

        return data

    def create(self, validated_data):
        # handle xls to xml conversion
        uploaded_xls_file = validated_data['xls_file']
        xml_form = parse_xls_form(uploaded_xls_file)

        # custom validation
        errors = []
        if xml_form['version'] == "":
            errors.append('The form requires as "settings" sheet with a valid version field')
        if len(errors) > 0:
            raise serializers.ValidationError({'xls_file': errors})

        validated_data['file'] = SimpleUploadedFile(xml_form.file_name, xml_form.file_content, content_type='text/xml')
        validated_data['version_id'] = xml_form['version']

        with transaction.atomic():
            # save version
            version: FormVersion = super().create(validated_data)

            # update form instance with survey settings
            # TODO: discuss
            form = version.form
            # form.name = xml_form['form_title']  # TODO: check if relevant to always overwrite form name that way
            form.form_id = xml_form['form_id']  # TODO: validate same as previous ? + validate uniqueness across account
            form.save()

        return version


class FormVersionsViewSet(ModelViewSet):
    """Form versions API: /api/formversions/"""

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = FormVersionSerializer
    results_key = "form_versions"
    queryset = FormVersion.objects.all()
    parser_classes = (parsers.MultiPartParser,)
    http_method_names = ('post',)

    def get_queryset(self):
        profile = self.request.user.iaso_profile

        return FormVersion.objects.filter(projects__account=profile.account)
