from itertools import chain

from rest_framework import permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from hat.menupermissions.constants import FEATUREFLAGES_TO_EXCLUDE
from iaso.models import FeatureFlag

from .common import ModelViewSet, TimestampField


class FeatureFlagsSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureFlag

        fields = ["id", "code", "name", "requires_authentication", "description", "created_at", "updated_at"]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)


class FeatureFlagViewSet(ModelViewSet):
    """Feature flag API

    This API is restricted to authenticated users

    GET /api/featureflags/
    GET /api/featureflags/<id>
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FeatureFlagsSerializer
    results_key = "featureflags"
    http_method_names = ["get", "head", "options"]

    def get_results_key(self):
        return self.results_key

    def get_queryset(self):
        featureflags = FeatureFlag.objects.all()
        return featureflags.order_by("name")

    @action(methods=["GET"], detail=False)
    def except_no_activated_modules(self, request):
        featureflags = self.get_queryset()

        current_account = request.user.iaso_profile.account
        account_modules = current_account.modules

        not_activated_modules = list(set(FEATUREFLAGES_TO_EXCLUDE.keys()) - set(account_modules))
        featureflags_to_exclude = list(
            chain.from_iterable([FEATUREFLAGES_TO_EXCLUDE[module] for module in not_activated_modules])
        )

        if featureflags_to_exclude:
            featureflags = featureflags.exclude(code__in=featureflags_to_exclude)

        serializer = FeatureFlagsSerializer(featureflags, many=True)
        return Response({self.get_results_key(): serializer.data})
