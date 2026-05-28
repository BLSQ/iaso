from django.contrib.gis import admin

from iaso.models import BulkCreateUserFile


@admin.register(BulkCreateUserFile)
class BulkCreateUserFile(admin.ModelAdmin):
    pass
