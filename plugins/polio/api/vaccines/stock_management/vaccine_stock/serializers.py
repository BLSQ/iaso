from rest_framework import serializers

from plugins.polio.models import VaccineStock
from plugins.polio.models.base import VaccineStockCalculator


class VaccineStockListSerializer(serializers.ListSerializer):
    @staticmethod
    def calculate_for_instance(instance):
        instance.calculator = VaccineStockCalculator(instance)

    def to_representation(self, data):
        """
        List of object instances -> List of dicts of primitive datatypes.
        """
        # Calculate once for each instance
        for instance in data:
            self.calculate_for_instance(instance)
        return [VaccineStockSerializer(instance).data for instance in data]


class VaccineStockSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source="country.name")
    country_id = serializers.IntegerField(source="country.id")
    vaccine_type = serializers.CharField(source="vaccine")
    vials_received = serializers.SerializerMethodField()
    vials_used = serializers.SerializerMethodField()
    stock_of_usable_vials = serializers.SerializerMethodField()
    stock_of_unusable_vials = serializers.SerializerMethodField()
    vials_destroyed = serializers.SerializerMethodField()
    stock_of_earmarked_vials = serializers.SerializerMethodField()
    doses_received = serializers.SerializerMethodField()
    doses_used = serializers.SerializerMethodField()
    stock_of_usable_doses = serializers.SerializerMethodField()
    stock_of_unusable_doses = serializers.SerializerMethodField()
    doses_destroyed = serializers.SerializerMethodField()
    stock_of_earmarked_doses = serializers.SerializerMethodField()

    class Meta:
        model = VaccineStock
        fields = [
            "id",
            "country_name",
            "country_id",
            "vaccine_type",
            "vials_received",
            "vials_used",
            "stock_of_usable_vials",
            "stock_of_unusable_vials",
            "stock_of_earmarked_vials",
            "vials_destroyed",
            "doses_received",
            "doses_used",
            "stock_of_usable_doses",
            "stock_of_unusable_doses",
            "stock_of_earmarked_doses",
            "doses_destroyed",
        ]
        list_serializer_class = VaccineStockListSerializer

    def get_vials_received(self, obj):
        return obj.calculator.get_vials_received()[0]

    def get_vials_used(self, obj):
        return obj.calculator.get_vials_used()[0]

    def get_stock_of_usable_vials(self, obj):
        return obj.calculator.get_total_of_usable_vials()[0]

    def get_stock_of_unusable_vials(self, obj):
        return obj.calculator.get_total_of_unusable_vials()[0]

    def get_vials_destroyed(self, obj):
        return obj.calculator.get_vials_destroyed()[0]

    def get_stock_of_earmarked_vials(self, obj):
        return obj.calculator.get_total_of_earmarked()[0]

    def get_doses_received(self, obj):
        return obj.calculator.get_vials_received()[1]

    def get_doses_used(self, obj):
        return obj.calculator.get_vials_used()[1]

    def get_stock_of_usable_doses(self, obj):
        return obj.calculator.get_total_of_usable_vials()[1]

    def get_stock_of_unusable_doses(self, obj):
        return obj.calculator.get_total_of_unusable_vials()[1]

    def get_doses_destroyed(self, obj):
        return obj.calculator.get_vials_destroyed()[1]

    def get_stock_of_earmarked_doses(self, obj):
        return obj.calculator.get_total_of_earmarked()[1]


class VaccineStockCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccineStock
        fields = ["country", "vaccine"]

    def create(self, validated_data):
        validated_data["account"] = self.context["request"].user.iaso_profile.account

        return VaccineStock.objects.create(**validated_data)
