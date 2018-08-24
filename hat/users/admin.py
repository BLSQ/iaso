from django.contrib import admin
from .models import Profile, Team, Coordination, Institution, UserType
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as AuthUserAdmin


class UserProfileInline(admin.StackedInline):
    model = Profile
    max_num = 1
    can_delete = False


class UserProfileInline(admin.StackedInline):
    model = Profile
    raw_id_fields = ('province_scope', 'ZS_scope', 'AS_scope')


class UserAdmin(AuthUserAdmin):

    inlines = [UserProfileInline, ]

    def add_view(self, *args, **kwargs):  # type: ignore
        self.inlines = [UserProfileInline, ]
        return super(UserAdmin, self).add_view(*args, **kwargs)

    def change_view(self, *args, **kwargs):  # type: ignore
        self.inlines = [UserProfileInline, ]
        return super(UserAdmin, self).change_view(*args, **kwargs)



# unregister old user admin
admin.site.unregister(User)
# register new user admin
admin.site.register(User, UserAdmin)


class TeamAdmin(admin.ModelAdmin):
    raw_id_fields = ('AS',)


admin.site.register(Team, TeamAdmin)
admin.site.register(Coordination)
admin.site.register(Institution)
admin.site.register(UserType)


