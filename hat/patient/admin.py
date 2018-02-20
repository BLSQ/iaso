from django.contrib import admin
from .models import Patient, Test


class PatientAdmin(admin.ModelAdmin):
    date_hierarchy = 'created_at'
    search_fields = ('first_name', 'last_name', 'post_name')


admin.site.register(Patient, PatientAdmin)


class TestAdmin(admin.ModelAdmin):
    search_fields = ('validator',)
    raw_id_fields = ('village', 'form')


admin.site.register(Test, TestAdmin)
