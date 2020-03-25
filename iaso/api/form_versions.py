import typing
from django.db import transaction
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import serializers, permissions, parsers
from rest_framework.authentication import BasicAuthentication

from iaso.models import Form, FormVersion
from iaso.odk import parsing
from .common import ModelViewSet, TimestampField, DynamicFieldsModelSerializer
from .auth.authentication import CsrfExemptSessionAuthentication
from .forms import HasFormPermission


class FormVersionSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = FormVersion
        default_fields = [
            "id",
            "version_id",
            "form_id",
            "xls_file",
            "file",
            "created_at",
            "updated_at",
        ]
        fields = [
            "id",
            "version_id",
            "form_id",
            "xls_file",
            "file",
            "created_at",
            "updated_at",
            "descriptor",
        ]
        read_only_fields = [
            "id",
            "version_id",
            "file",
            "created_at",
            "updated_at",
            "descriptor",
        ]

    form_id = serializers.PrimaryKeyRelatedField(
        source="form", queryset=Form.objects.all()
    )
    xls_file = serializers.FileField(
        required=True, allow_empty_file=False
    )  # field is not required in model
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    descriptor = serializers.SerializerMethodField()

    def get_descriptor(self, form_version):
        json_survey = parsing.to_json_dict(form_version)
        return json_survey

    def validate(self, data: typing.MutableMapping):
        form = data["form"]

        # validate form (access check)
        permission_checker = HasFormPermission()
        if not permission_checker.has_object_permission(
            self.context["request"], self.context["view"], form
        ):
            raise serializers.ValidationError({"form_id": "Invalid form id"})

        # fetch previous version
        try:
            previous_version = FormVersion.objects.filter(form=form).latest(
                "created_at"
            )
            previous_version_id = previous_version.version_id
        except FormVersion.DoesNotExist:
            previous_version_id = None

        # handle xls to xml conversion
        uploaded_xls_file = data["xls_file"]
        try:
            xml_form = parsing.parse_xls_form(
                uploaded_xls_file, previous_version=previous_version_id
            )
        except parsing.ParsingError as e:
            raise serializers.ValidationError({"xls_file": str(e)})

        # validate that form_id stays constant across versions
        if form.form_id is not None and xml_form["form_id"] != form.form_id:
            raise serializers.ValidationError(
                {"xls_file": "Form id should stay constant across form versions."}
            )

        # validate form_id (from XLS file) uniqueness across account
        all_accounts = set(
            project.account for project in form.projects.all()
        )  # TODO: discuss - smells weird
        for account in all_accounts:
            queryset = Form.objects.filter(
                projects__account=account, form_id=xml_form["form_id"]
            ).exclude(pk=form.id)
            if queryset.exists():
                raise serializers.ValidationError(
                    {"xls_file": "The form_id is already used in another form."}
                )

        data["file"] = SimpleUploadedFile(
            xml_form.file_name, xml_form.file_content, content_type="text/xml"
        )
        data["version_id"] = xml_form["version"]
        data["form_form_id"] = xml_form["form_id"]

        return data

    def create(self, validated_data: typing.MutableMapping):
        form_form_id = validated_data.pop("form_form_id")
        with transaction.atomic():
            # save version
            version: FormVersion = super().create(validated_data)

            # update form instance with survey settings
            form = version.form
            form.form_id = form_form_id
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
    http_method_names = ("post", "get")

    def get_queryset(self):
        profile = self.request.user.iaso_profile
        return FormVersion.objects.filter(form__projects__account=profile.account)
