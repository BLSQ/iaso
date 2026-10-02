import json

from django.db.models import Value
from django.test import SimpleTestCase
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from iaso.api.v3.common.dynamic_fields import (
    BatchLoader,
    DynamicFieldsMixin,
    KeyedColumns,
    PositionalColumns,
    describe_fields,
    optimize_queryset,
    tabular_columns,
    tabular_values,
)
from iaso.models import OrgUnit


class _TypeSerializer(DynamicFieldsMixin, serializers.Serializer):
    allow_sub_selector = False

    id = serializers.IntegerField()
    name = serializers.CharField()


class _SummarySerializer(DynamicFieldsMixin, serializers.Serializer):
    default_fields = ("id", "name")

    id = serializers.IntegerField()
    name = serializers.CharField()
    source_ref = serializers.CharField(allow_null=True)
    org_unit_type = _TypeSerializer(allow_null=True)


class _GroupSerializer(DynamicFieldsMixin, serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


def _load_nothing(rows, serializer):
    pass


class _OrgUnitSerializer(DynamicFieldsMixin, serializers.Serializer):
    default_fields = ("id", "name")
    annotations = {"flag": {"flag": Value(True)}}
    batch_loaders = {"ancestors": BatchLoader(_load_nothing, requires=("path",))}

    id = serializers.IntegerField()
    name = serializers.CharField()
    code = serializers.CharField()
    latitude = serializers.FloatField(source="location.y", allow_null=True)
    org_unit_type_id = serializers.IntegerField(allow_null=True)
    flag = serializers.BooleanField()
    whole = serializers.SerializerMethodField()
    org_unit_type = _TypeSerializer(allow_null=True)
    parent = _SummarySerializer(allow_null=True)
    groups = _GroupSerializer(many=True)
    group_ids = serializers.PrimaryKeyRelatedField(source="groups", many=True, read_only=True)
    ancestors = _SummarySerializer(source="v3_ancestors", many=True)

    def get_whole(self, obj):
        return None


class PruneTestCase(SimpleTestCase):
    def test_unpruned_serializer_keeps_every_declared_field(self):
        self.assertEqual(list(_OrgUnitSerializer().fields), list(_OrgUnitSerializer._declared_fields))

    def test_no_field_tree_means_default_fields(self):
        self.assertEqual(list(_OrgUnitSerializer(field_tree=None).fields), ["id", "name"])

    def test_fields_follow_the_requested_order(self):
        serializer = _OrgUnitSerializer(field_tree={"code": {}, "id": {}})
        self.assertEqual(list(serializer.fields), ["code", "id"])

    def test_nested_relation_without_sub_selector_uses_its_defaults(self):
        serializer = _OrgUnitSerializer(field_tree={"parent": {}})
        self.assertEqual(list(serializer.fields["parent"].fields), ["id", "name"])

    def test_nested_relation_always_includes_its_id(self):
        serializer = _OrgUnitSerializer(field_tree={"parent": {"source_ref": {}}, "ancestors": {"name": {}}})
        self.assertEqual(list(serializer.fields["parent"].fields), ["id", "source_ref"])
        self.assertEqual(list(serializer.fields["ancestors"].child.fields), ["id", "name"])

    def test_top_level_does_not_force_id(self):
        self.assertEqual(list(_OrgUnitSerializer(field_tree={"name": {}}).fields), ["name"])

    def test_fixed_shape_relation_returns_every_field(self):
        serializer = _OrgUnitSerializer(field_tree={"org_unit_type": {}})
        self.assertEqual(list(serializer.fields["org_unit_type"].fields), ["id", "name"])

    def test_pruning_recurses_through_several_levels(self):
        serializer = _OrgUnitSerializer(field_tree={"parent": {"org_unit_type": {}}})
        self.assertEqual(list(serializer.fields["parent"].fields), ["id", "org_unit_type"])
        self.assertEqual(list(serializer.fields["parent"].fields["org_unit_type"].fields), ["id", "name"])


class ValidateTreeTestCase(SimpleTestCase):
    def assert_bad_request(self, field_tree, error):
        with self.assertRaises(ValidationError) as ctx:
            _OrgUnitSerializer.validate_tree(field_tree)
        self.assertEqual(ctx.exception.detail["error"], error)

    def test_empty_tree_is_valid(self):
        _OrgUnitSerializer.validate_tree(None)
        _OrgUnitSerializer.validate_tree({})

    def test_known_fields_and_sub_fields_are_valid(self):
        _OrgUnitSerializer.validate_tree({"id": {}, "parent": {"name": {}, "org_unit_type": {}}})

    def test_unknown_top_level_field(self):
        self.assert_bad_request({"id": {}, "nope": {}}, "Unknown field(s) in fields=: nope")

    def test_unknown_sub_field_is_reported_with_its_path(self):
        self.assert_bad_request({"parent": {"nope": {}}}, "Unknown field(s) in fields=: parent.nope")

    def test_sub_selector_on_a_plain_field(self):
        self.assert_bad_request({"name": {"id": {}}}, "name doesn't support a sub-selector")

    def test_sub_selector_on_a_fixed_shape_relation(self):
        self.assert_bad_request({"org_unit_type": {"name": {}}}, "org_unit_type doesn't support a sub-selector")

    def test_nested_fixed_shape_relation(self):
        self.assert_bad_request(
            {"parent": {"org_unit_type": {"name": {}}}}, "parent.org_unit_type doesn't support a sub-selector"
        )


class DescribeFieldsTestCase(SimpleTestCase):
    def test_describes_defaults_and_relations(self):
        description = describe_fields(_OrgUnitSerializer)
        self.assertEqual(description["default_fields"], ["id", "name"])
        self.assertEqual(description["fields"]["code"], {"default": False})
        parent = description["fields"]["parent"]
        self.assertEqual(parent["many"], False)
        self.assertEqual(parent["sub_selector"], True)
        self.assertEqual(parent["default_subfields"], ["id", "name"])
        self.assertEqual(parent["allowed_subfields"], ["id", "name", "org_unit_type", "source_ref"])
        self.assertEqual(description["fields"]["ancestors"]["many"], True)
        self.assertEqual(description["fields"]["org_unit_type"]["sub_selector"], False)


class OptimizeQuerysetTestCase(SimpleTestCase):
    """Only inspects the built queryset (no query is run)."""

    def optimize(self, field_tree):
        return optimize_queryset(OrgUnit.objects.all(), _OrgUnitSerializer(field_tree=field_tree))

    def loaded_columns(self, queryset):
        return set(queryset.query.deferred_loading[0])

    def test_plain_fields_become_only_columns(self):
        queryset = self.optimize({"name": {}, "latitude": {}, "org_unit_type_id": {}})
        self.assertEqual(self.loaded_columns(queryset), {"id", "name", "location", "org_unit_type_id"})
        self.assertFalse(queryset.query.select_related)
        self.assertEqual(queryset._prefetch_related_lookups, ())

    def test_fk_relation_is_select_related_with_only_its_columns(self):
        queryset = self.optimize({"parent": {"org_unit_type": {}}})
        self.assertEqual(queryset.query.select_related, {"parent": {"org_unit_type": {}}})
        self.assertEqual(
            self.loaded_columns(queryset),
            {
                "id",
                "parent_id",
                "parent__id",
                "parent__org_unit_type_id",
                "parent__org_unit_type__id",
                "parent__org_unit_type__name",
            },
        )

    def test_m2m_fields_sharing_a_relation_share_one_prefetch(self):
        (prefetch,) = self.optimize({"groups": {}, "group_ids": {}})._prefetch_related_lookups
        self.assertEqual(prefetch.prefetch_through, "groups")
        self.assertEqual(set(prefetch.queryset.query.deferred_loading[0]), {"id", "name"})

    def test_annotation_only_when_requested(self):
        self.assertNotIn("flag", self.optimize({"id": {}}).query.annotations)
        self.assertIn("flag", self.optimize({"flag": {}}).query.annotations)

    def test_batch_loaded_field_keeps_the_columns_its_loader_needs(self):
        self.assertEqual(self.loaded_columns(self.optimize({"ancestors": {}})), {"id", "path"})

    def test_whole_object_and_non_model_sources_add_no_column(self):
        self.assertEqual(self.loaded_columns(self.optimize({"whole": {}})), {"id"})


class TabularTestCase(SimpleTestCase):
    def test_nested_object_becomes_dotted_columns(self):
        serializer = _OrgUnitSerializer(field_tree={"id": {}, "parent": {"org_unit_type": {}}})
        self.assertEqual(
            tabular_columns(serializer, {}),
            ["id", "parent.id", "parent.org_unit_type.id", "parent.org_unit_type.name"],
        )
        row = {"id": 3, "parent": {"id": 2, "org_unit_type": {"id": 9, "name": "Region"}}}
        self.assertEqual(tabular_values(row, serializer, {}), [3, 2, 9, "Region"])

    def test_missing_nested_object_gives_empty_cells(self):
        serializer = _OrgUnitSerializer(field_tree={"id": {}, "parent": {"org_unit_type": {}}})
        self.assertEqual(tabular_values({"id": 1, "parent": None}, serializer, {}), [1, None, None, None])

    def test_positional_list(self):
        serializer = _OrgUnitSerializer(field_tree={"ancestors": {"name": {}}})
        layout = {"ancestors": PositionalColumns(count=2)}
        self.assertEqual(
            tabular_columns(serializer, layout),
            ["ancestors[0].id", "ancestors[0].name", "ancestors[1].id", "ancestors[1].name"],
        )
        row = {"ancestors": [{"id": 1, "name": "Root"}]}
        self.assertEqual(tabular_values(row, serializer, layout), [1, "Root", None, None])

    def test_keyed_list(self):
        serializer = _OrgUnitSerializer(field_tree={"groups": {}})
        layout = {"groups": KeyedColumns(label="group", keys=[7, 5])}
        self.assertEqual(
            tabular_columns(serializer, layout), ["group-5.id", "group-5.name", "group-7.id", "group-7.name"]
        )
        row = {"groups": [{"id": 7, "name": "Seven"}]}
        self.assertEqual(tabular_values(row, serializer, layout), [None, None, 7, "Seven"])

    def test_list_of_scalars_is_joined_and_other_structures_are_json(self):
        serializer = _OrgUnitSerializer(field_tree={"group_ids": {}, "code": {}, "whole": {}})
        row = {"group_ids": [1, 2], "code": {"type": "Point"}, "whole": [{"a": 1}]}
        self.assertEqual(
            tabular_values(row, serializer, {}), ["1;2", json.dumps({"type": "Point"}), json.dumps([{"a": 1}])]
        )

    def test_list_of_objects_without_layout_is_one_json_column(self):
        serializer = _OrgUnitSerializer(field_tree={"groups": {}})
        self.assertEqual(tabular_columns(serializer, {}), ["groups"])
        self.assertEqual(
            tabular_values({"groups": [{"id": 1, "name": "G"}]}, serializer, {}), ['[{"id": 1, "name": "G"}]']
        )
