import typing

from rest_framework import serializers
from iaso.models import GroupSet, Group, DataSource, SourceVersion
from iaso.api.common import TimestampField, DynamicFieldsModelSerializer


class DataSourceSerializerForGroupset(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = ["id", "name"]


class SourceVersionSerializerForGroupset(serializers.ModelSerializer):
    class Meta:
        model = SourceVersion
        fields = ["id", "number", "data_source"]

    data_source = DataSourceSerializerForGroupset()


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group

        fields = ["id", "name", "created_at", "updated_at", "source_version"]
        default_fields = ["id", "name", "created_at", "updated_at"]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    source_version = SourceVersionSerializerForGroupset(read_only=True)


class GroupSetSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = GroupSet
        default_fields = [
            "id",
            "name",
            "source_version",
            "group_ids",
            "created_at",
            "updated_at",
        ]
        fields = [
            "id",
            "name",
            "source_version",
            "groups",
            "group_ids",
            "created_at",
            "updated_at",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")
        # filter on what the user has access to
        if request:
            user = request.user
            if "group_ids" in self.fields:
                self.fields["group_ids"].child_relation.queryset = Group.objects.filter_for_user(user)

    def validate(self, attrs: typing.MutableMapping):
        data = self.context["request"].data
        if self.context["request"].method == "POST":
            return self.validate_create(data)
        else:
            return data

    def validate_create(self, attrs: typing.Mapping):
        request = self.context.get("request")
        user = request.user

        if self.initial_data.get("source_version_id") is None:
            raise serializers.ValidationError(detail={"source_version_id": "This field is required."})

        group_ids = self.context["request"].data.get("group_ids")
        if group_ids:
            # Ensure all provided group_ids are valid and belong to the same source_version
            groups = Group.objects.filter_for_user(user).filter(id__in=group_ids)
            target_group_ids = [g.id for g in groups]
            if len(target_group_ids) != len(group_ids):
                debug_groups = [f"{g.name} ({g.id})" for g in groups]
                raise serializers.ValidationError(
                    detail={"group_ids": f"Some groups do not exist : found {debug_groups} vs {group_ids}."}
                )

            source_version = self.initial_data.get("source_version_id")
            if self.instance and source_version is None:
                source_version = self.instance.source_version.id

            source_ids = list(set([group.source_version_id for group in groups]))
            if len(source_ids) > 1:
                raise serializers.ValidationError(
                    detail={"group_ids": f"Groups do not all belong to the same SourceVersion : {source_ids}."}
                )

            if len(source_ids) == 1:
                if source_ids[0] != source_version:
                    raise serializers.ValidationError(
                        detail={
                            "group_ids": f"Groups do not all belong to the same as the groupset : {source_ids} vs {source_version}."
                        }
                    )

        return attrs

    def assign_relations(self, group_set):
        request = self.context.get("request")
        user = request.user

        source_version_id = self.context["request"].data.get("source_version_id")
        if source_version_id:
            source_version = SourceVersion.objects.filter_for_user(user).get(pk=source_version_id)
            group_set.source_version = source_version
            group_set.save()

        group_ids = self.context["request"].data.get("group_ids")
        if group_ids:
            # Ensure all provided group_ids are valid and belong to the same source_version
            groups = Group.objects.filter(id__in=group_ids)

            for g in groups:
                group_set.groups.add(g)

    def ensure_clean_validated_data(self, validated_data):
        if "groups" in validated_data:
            del validated_data["groups"]
        if "group_ids" in validated_data:
            del validated_data["group_ids"]

    def create(self, validated_data):
        self.ensure_clean_validated_data(validated_data)
        group_set = GroupSet.objects.create(**validated_data)
        self.assign_relations(group_set)
        return group_set

    def update(self, instance, validated_data):
        self.ensure_clean_validated_data(validated_data)
        # patch behaviour
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        self.assign_relations(instance)
        return instance

    source_version = SourceVersionSerializerForGroupset(read_only=True)
    groups = GroupSerializer(many=True, read_only=True)

    # using none() to avoid leaking other project info
    # see __init__ to filter based on user access
    group_ids = serializers.PrimaryKeyRelatedField(
        source="groups", many=True, queryset=Group.objects.none(), required=False, allow_null=True
    )

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
