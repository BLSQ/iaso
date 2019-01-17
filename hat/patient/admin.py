from django.contrib import admin
from .models import Patient, Test, TestGroup, Treatment


class PatientAdmin(admin.ModelAdmin):
    date_hierarchy = 'created_at'
    search_fields = ('first_name', 'last_name', 'post_name')
    raw_id_fields = ('origin_village', 'origin_area')


class TestAdmin(admin.ModelAdmin):
    search_fields = ('validator',)
    raw_id_fields = ('village', 'form', 'traveller_area', 'image', 'video')


class TreatmentAdmin(admin.ModelAdmin):
    raw_id_fields = ('patient',)


admin.site.register(Patient, PatientAdmin)
admin.site.register(Test, TestAdmin)
admin.site.register(TestGroup)
admin.site.register(Treatment, TreatmentAdmin)
