from rest_framework import filters, serializers
from rest_framework.fields import Field

from iaso.api.common import ModelViewSet, UserSerializer
from iaso.models import OrgUnit

from ..models import CountryUsersGroup


class UserSerializerForPolio(UserSerializer):
    class Meta(UserSerializer.Meta):
        fields = ["id", "username", "first_name", "last_name", "email"]
        ref_name = "polio_user_serializer"


class CountryUsersGroupSerializer(serializers.ModelSerializer):
    read_only_users_field = UserSerializerForPolio(source="users", many=True, read_only=True)
    country_name: Field = serializers.SlugRelatedField(source="country", slug_field="name", read_only=True)

    class Meta:
        model = CountryUsersGroup
        read_only_fields = ["id", "country", "created_at", "updated_at", "read_only_users_field"]
        fields = [
            "id",
            "country",
            "language",
            "created_at",
            "updated_at",
            "country_name",
            "users",
            "read_only_users_field",
            "teams",
        ]


class CountryUsersGroupViewSet(ModelViewSet):
    serializer_class = CountryUsersGroupSerializer
    results_key = "country_users_group"
    http_method_names = ["get", "put"]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["country__name", "language"]

    def get_queryset(self):
        countries = OrgUnit.objects.filter_for_user_and_app_id(self.request.user).filter(
            org_unit_type__category="COUNTRY"
        )
        countries_without_group = countries.filter(countryusersgroup__isnull=True)

        if countries_without_group.exists():
            groups_to_create = [CountryUsersGroup(country=country) for country in countries_without_group]
            CountryUsersGroup.objects.bulk_create(groups_to_create, ignore_conflicts=True)

        return CountryUsersGroup.objects.filter(country__in=countries)
