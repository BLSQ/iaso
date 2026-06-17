from rest_framework import serializers

from iaso.modules import MODULES


class ModuleDropdownSerializer(serializers.Serializer):
    label = serializers.CharField(source="name")
    value = serializers.ChoiceField(source="codename", choices=[x.codename for x in MODULES])
