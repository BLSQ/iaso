from django.contrib import admin

from .models import Province, ZS, AS, Village, PopulationData

admin.site.register(Province)


class ZSAdmin(admin.ModelAdmin):
    list_filter = ('province', )
    search_fields = ('name',)
    ordering = ('name',)


admin.site.register(ZS, ZSAdmin)


class ASAdmin(admin.ModelAdmin):
    list_filter = ('ZS',)
    search_fields = ('name',)
    ordering = ('name', )


admin.site.register(AS, ASAdmin)


class VillageAdmin(admin.ModelAdmin):
    list_filter = ('village_type', 'village_official', 'gps_source')
    search_fields = ('name',)
    raw_id_fields = ('AS',)


admin.site.register(Village, VillageAdmin)


class PopulationDataAdmin(admin.ModelAdmin):
    list_filter = ('type', )
    search_fields = ('village__name',)
    raw_id_fields = ('village',)


admin.site.register(PopulationData, PopulationDataAdmin)




