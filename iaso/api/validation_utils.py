from django.contrib.auth.models import User
from rest_framework import serializers

from iaso.models import OrgUnitType


def validate_org_unit_types_for_user(user: User, org_unit_types: list):
    if user.is_superuser or not user.iaso_profile.projects.exists():
        return org_unit_types  # There is no need to check if it's a superuser or if the user has access to all projects
    if org_unit_types:
        org_unit_types_for_user = OrgUnitType.objects.filter_for_user_and_app_id(user=user).values_list("id", flat=True)
        for org_unit_type in org_unit_types:
            if org_unit_type.id not in org_unit_types_for_user:
                raise serializers.ValidationError(f"The user doesn't have access to the OrgUnitType {org_unit_type.id}")
    return org_unit_types

