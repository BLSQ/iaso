from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.common.serializer import ListQueryOptimizedSerializer
from iaso.api.common.serializer_fields import IasoPrimaryKeyRelatedField, IasoSlugRelatedField

from .models import OtherTestNestedModel, TestModelForListQueryOptimizedSerializer, TestNestedModel


# setup the serializers
class ClassicDRFPkSerializer(ModelSerializer):
    nested = serializers.PrimaryKeyRelatedField(
        allow_null=True, write_only=True, required=False, queryset=TestNestedModel.objects.all()
    )
    many_nested = serializers.PrimaryKeyRelatedField(
        many=True,
        allow_null=True,
        allow_empty=True,
        write_only=True,
        required=False,
        queryset=OtherTestNestedModel.objects.all(),
    )

    class Meta:
        model = TestModelForListQueryOptimizedSerializer
        fields = ("nested", "many_nested")


class OptimizedDRFPkSerializer(ModelSerializer):
    nested = IasoPrimaryKeyRelatedField(
        allow_null=True, write_only=True, required=False, queryset=TestNestedModel.objects.all()
    )
    many_nested = IasoPrimaryKeyRelatedField(
        many=True,
        allow_null=True,
        allow_empty=True,
        write_only=True,
        required=False,
        queryset=OtherTestNestedModel.objects.all(),
    )

    class Meta:
        model = TestModelForListQueryOptimizedSerializer
        fields = ("nested", "many_nested")


class ClassicDRFPkOptimizedListSerializer(ClassicDRFPkSerializer):
    class Meta(ClassicDRFPkSerializer.Meta):
        list_serializer_class = ListQueryOptimizedSerializer


class OptimizedDRFPkOptimizedListSerializer(OptimizedDRFPkSerializer):
    class Meta(OptimizedDRFPkSerializer.Meta):
        list_serializer_class = ListQueryOptimizedSerializer


class ClassicDRFSlugSerializer(ModelSerializer):
    nested = serializers.SlugRelatedField(
        slug_field="name", allow_null=True, write_only=True, required=False, queryset=TestNestedModel.objects.all()
    )
    many_nested = serializers.SlugRelatedField(
        slug_field="name",
        many=True,
        allow_null=True,
        allow_empty=True,
        write_only=True,
        required=False,
        queryset=OtherTestNestedModel.objects.all(),
    )

    class Meta:
        model = TestModelForListQueryOptimizedSerializer
        fields = ("nested", "many_nested")


class OptimizedDRFSlugSerializer(ModelSerializer):
    nested = IasoSlugRelatedField(
        slug_field="name", allow_null=True, write_only=True, required=False, queryset=TestNestedModel.objects.all()
    )
    many_nested = IasoSlugRelatedField(
        slug_field="name",
        many=True,
        allow_null=True,
        allow_empty=True,
        write_only=True,
        required=False,
        queryset=OtherTestNestedModel.objects.all(),
    )

    class Meta:
        model = TestModelForListQueryOptimizedSerializer
        fields = ("nested", "many_nested")


class ClassicDRFSlugOptimizedListSerializer(ClassicDRFSlugSerializer):
    class Meta(ClassicDRFPkSerializer.Meta):
        list_serializer_class = ListQueryOptimizedSerializer


class OptimizedDRFSlugOptimizedListSerializer(OptimizedDRFSlugSerializer):
    class Meta(OptimizedDRFPkSerializer.Meta):
        list_serializer_class = ListQueryOptimizedSerializer
