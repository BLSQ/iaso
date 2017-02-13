from django.contrib import admin

from .models import MobileUser


class MobileUserAdmin(admin.ModelAdmin):
    list_display = ('email',)
    fields = ['email', ]


admin.site.register(MobileUser, MobileUserAdmin)
