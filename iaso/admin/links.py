from django.contrib.gis import admin

from iaso.admin.utils import admin_attr_decorator
from iaso.models import Link


@admin.register(Link)
@admin_attr_decorator
class LinkAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("source", "destination")
