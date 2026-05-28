from django.contrib.gis import admin

from iaso.models import OrgUnitChangeRequestConfiguration


@admin.register(OrgUnitChangeRequestConfiguration)
class OrgUnitChangeRequestConfigurationAdmin(admin.ModelAdmin):
    autocomplete_fields = ["project"]
