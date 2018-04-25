from django.contrib import admin

from .models import Metric, DataPoint

admin.site.register(Metric)
admin.site.register(DataPoint)



