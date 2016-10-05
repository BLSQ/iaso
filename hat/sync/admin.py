from django.contrib import admin

from .models import MobileUser

admin.site.register(MobileUser)

# TODO: remove couchdb_id and db_name fields from admin
# https://docs.djangoproject.com/en/1.10/ref/contrib/admin/#django.contrib.admin.ModelAdmin.exclude
