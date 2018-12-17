from django.contrib import admin
from .models import Patient, Test, TestGroup


class PatientAdmin(admin.ModelAdmin):
    date_hierarchy = 'created_at'
    search_fields = ('first_name', 'last_name', 'post_name')


class TestAdmin(admin.ModelAdmin):
    search_fields = ('validator',)
    raw_id_fields = ('village', 'form', 'traveller_area', 'image', 'video')


admin.site.register(Patient, PatientAdmin)
admin.site.register(Test, TestAdmin)
admin.site.register(TestGroup)
