from django.contrib.gis import admin

from iaso.models import ExternalCredentials


@admin.register(ExternalCredentials)
class ExternalCredentialsAdmin(admin.ModelAdmin):
    pass
