from django.contrib import admin

from .models import Case, Location, TestGroup


class CaseAdmin(admin.ModelAdmin):
    date_hierarchy = 'document_date'
    list_filter = ('test_catt', 'ZS')

admin.site.register(Case, CaseAdmin)

admin.site.register(Location)

class TestGroupAdmin(admin.ModelAdmin):
    date_hierarchy = 'created_at'

admin.site.register(TestGroup, TestGroupAdmin)
