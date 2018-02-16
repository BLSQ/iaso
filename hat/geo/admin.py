from django.contrib import admin

from .models import Province, ZS, AS, Village

admin.site.register(Province)


class ZSAdmin(admin.ModelAdmin):
    list_filter = ('province', )
    search_fields = ('name',)
    ordering = ('name',)

admin.site.register(ZS, ZSAdmin)


class ASAdmin(admin.ModelAdmin):
    list_filter = ('ZS',)
    search_fields = ('name',)

admin.site.register(AS, ASAdmin)


class VillageAdmin(admin.ModelAdmin):
    list_filter = ('village_type', 'village_official', 'gps_source')
    search_fields = ('name',)


admin.site.register(Village, VillageAdmin)






