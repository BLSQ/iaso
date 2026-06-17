from django.db import OperationalError, ProgrammingError
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import AccountFeatureFlag


class AccountFeatureFlagDropdownSerializer(ModelSerializer):
    label = serializers.CharField(read_only=True, source="name")
    value = serializers.ChoiceField(read_only=True, source="code", choices=[])

    class Meta:
        model = AccountFeatureFlag
        fields = ["label", "value"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            self.fields["value"].choices = list(AccountFeatureFlag.objects.values_list("code", flat=True))
        except (OperationalError, ProgrammingError):
            # we do this because in the views.py we annotate like
            # @extend_schema(responses=AccountFeatureFlagDropdownSerializer(many=True))
            # which passes into the init and trigger a db query
            # On a db that has not been migrated yet, it crashes, and forbids any manage.py command to work properly then.
            # This is a dirty fix, proper fix would be to refactor account feature flag that should be a static list (like modules)
            pass  # noqa
