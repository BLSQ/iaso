from django.contrib.auth import get_user_model
from rest_framework import serializers

from hat.audit.models import Modification
from iaso.models import OrgUnit
from iaso.models.base import Profile


class NestedOrgUnitForListSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name"]


class NestedUserForListSerializer(serializers.ModelSerializer):
    user_id = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = get_user_model()
        fields = ["user_id", "username", "first_name", "last_name"]

    def get_user_id(self, user):
        return user.id


class ProfileLogListSerializer(serializers.ModelSerializer):
    # The user who created the Log
    modified_by = serializers.SerializerMethodField(read_only=True)
    # The user in the content of the Log
    user = serializers.SerializerMethodField(read_only=True)
    past_location = serializers.SerializerMethodField(read_only=True)
    new_location = serializers.SerializerMethodField(read_only=True)
    fields_modified = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Modification
        fields = ["id", "user", "modified_by", "past_location", "new_location", "created_at", "fields_modified"]

    def get_modified_by(self, modification):
        return {"id": modification.user.iaso_profile.id, **NestedUserForListSerializer(modification.user).data}

    def get_user(self, modification):
        # Use .first() because profiles can be hard deleted
        profile = Profile.objects.select_related("user").filter(pk=int(modification.object_id)).first()
        if profile is not None:
            return {"id": profile.id, **NestedUserForListSerializer(profile.user).data}
        return {}

    def get_past_location(self, modification):
        past_value = modification.past_value
        if not past_value:
            return []
        org_unit_ids = past_value[0]["fields"].get("org_units", None)
        if not org_unit_ids:
            return []
        org_units = OrgUnit.objects.filter(pk__in=org_unit_ids)
        serializer = NestedOrgUnitForListSerializer(org_units, many=True)
        return serializer.data

    def get_new_location(self, modification):
        new_value = modification.new_value
        if not new_value:
            return []
        org_unit_ids = new_value[0]["fields"].get("org_units", None)
        if not org_unit_ids:
            return []
        org_units = OrgUnit.objects.filter(pk__in=org_unit_ids)
        serializer = NestedOrgUnitForListSerializer(org_units, many=True)

        return serializer.data

    def get_fields_modified(self, modification):
        diffs = modification.field_diffs()
        if not modification.past_value:
            return ["new_user_created"]
        # password updated will always be in the added dict because it's never present on past value
        password_updated = diffs["added"].get("password_updated", None)
        if password_updated:
            if password_updated.get("after", False):
                diffs["added"]["password"] = password_updated
            del diffs["added"]["password_updated"]

        added = list(diffs["added"].keys())
        removed = list(diffs["removed"].keys())
        modified = list(diffs["modified"].keys())
        result = list(set(removed + added + modified))
        result.sort()
        # filter user and account because these can't be modified
        return [key for key in result if key != "user" and key != "account"]


class ProfileLogRetrieveSerializer(serializers.ModelSerializer):
    past_value = serializers.SerializerMethodField(read_only=True)
    new_value = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Modification
        fields = ["id", "created_at", "user", "source", "new_value", "past_value", "object_id", "content_type"]

    def _fetch_and_transform_data(self, org_units, projects, user_roles):
        org_units_names_and_ids = OrgUnit.objects.filter(id__in=org_units).values("id", "name")
        projects_names_and_ids = Project.objects.filter(id__in=projects).values("id", "name")
        user_roles_group_names_and_ids = UserRole.objects.filter(id__in=user_roles).values("id", "group__name")
        user_roles_names_and_ids = [
            {"id": entry["id"], "name": UserRole.remove_user_role_name_prefix(entry["group__name"])}
            for entry in user_roles_group_names_and_ids
        ]
        return org_units_names_and_ids, projects_names_and_ids, user_roles_names_and_ids

    def get_past_value(self, modification):
        if not modification.past_value:
            return []
        logged_org_units = modification.past_value[0]["fields"]["org_units"]
        logged_projects = modification.past_value[0]["fields"]["projects"]
        logged_user_roles = modification.past_value[0]["fields"]["user_roles"]

        org_units, projects, user_roles = self._fetch_and_transform_data(
            logged_org_units, logged_projects, logged_user_roles
        )

        past_value_copy = copy.deepcopy(modification.past_value)
        past_value_copy[0]["fields"]["org_units"] = org_units
        past_value_copy[0]["fields"]["projects"] = projects
        past_value_copy[0]["fields"]["user_roles"] = user_roles

        return past_value_copy

    def get_new_value(self, modification):
        logged_org_units = modification.new_value[0]["fields"]["org_units"]
        logged_projects = modification.new_value[0]["fields"]["projects"]
        logged_user_roles = modification.new_value[0]["fields"]["user_roles"]

        org_units, projects, user_roles = self._fetch_and_transform_data(
            logged_org_units, logged_projects, logged_user_roles
        )

        new_value_copy = copy.deepcopy(modification.new_value)
        new_value_copy[0]["fields"]["org_units"] = org_units
        new_value_copy[0]["fields"]["projects"] = projects
        new_value_copy[0]["fields"]["user_roles"] = user_roles

        return new_value_copy
