from rest_framework import serializers

from iaso.models import Form, Group, GroupSet, OrgUnitType


def validate_org_unit_types(user, org_unit_types):
    if user.is_superuser:
        return  # There is no need to check if it's a superuser
    if org_unit_types:
        org_unit_types_for_user = OrgUnitType.objects.filter_for_user_and_app_id(user=user).values_list("id", flat=True)
        for org_unit_type in org_unit_types:
            if org_unit_type.id not in org_unit_types_for_user:
                raise serializers.ValidationError(f"The user doesn't have access to the OrgUnitType {org_unit_type.id}")


def validate_group_sets(user, group_sets):
    if user.is_superuser:
        return  # There is no need to check if it's a superuser
    if group_sets:
        group_sets_for_user = GroupSet.objects.filter_for_user_and_app_id(user=user).values_list("id", flat=True)
        for group_set in group_sets:
            if group_set.id not in group_sets_for_user:
                raise serializers.ValidationError(f"The user doesn't have access to the GroupSet {group_set.id}")


def validate_forms(user, forms):
    if user.is_superuser:
        return  # There is no need to check if it's a superuser
    if forms:
        forms_for_user = Form.objects.filter_for_user_and_app_id(user=user).values_list("id", flat=True)
        for form in forms:
            if form.id not in forms_for_user:
                raise serializers.ValidationError(f"The user doesn't have access to the Form {form.id}")


def validate_groups(user, groups):
    if user.is_superuser:
        return  # There is no need to check if it's a superuser
    if groups:
        groups_for_user = Group.objects.filter_for_user(user=user).values_list("id", flat=True)
        for group in groups:
            if group.id not in groups_for_user:
                raise serializers.ValidationError(f"The user doesn't have access to the Group {group.id}")
