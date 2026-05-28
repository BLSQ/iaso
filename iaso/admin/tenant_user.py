from django.contrib.gis import admin
from django.urls import reverse
from django.utils.html import format_html

from iaso.models import TenantUser


@admin.register(TenantUser)
class TenantUserAdmin(admin.ModelAdmin):
    list_display = (
        "main_user",
        "account_user_link",
        "account",
        "created_at",
        "updated_at",
        "all_accounts_count",
        "is_self_account",
    )
    list_filter = ("account_user__iaso_profile__account",)
    search_fields = ("main_user__username", "account_user__username", "account_user__iaso_profile__account__name")
    raw_id_fields = ("main_user", "account_user")
    readonly_fields = ("created_at", "updated_at", "account", "all_account_users", "other_accounts")

    def account_user_link(self, obj):
        # Create a link to the User change page in the admin
        url = reverse("admin:auth_user_change", args=[obj.account_user.pk])
        return format_html('<a href="{}">{}</a>', url, obj.account_user.username)

    def get_urls(self):
        urls = super().get_urls()
        return urls

    @admin.display(
        description="Account",
        ordering="account_user__iaso_profile__account",
    )
    def account(self, obj):
        return obj.account

    @admin.display(description="Total Accounts")
    def all_accounts_count(self, obj):
        return obj.main_user.tenant_users.count()

    @admin.display(
        description="Self Account",
        boolean=True,
    )
    def is_self_account(self, obj):
        return obj.main_user == obj.account_user

    @admin.display(description="All Account Users")
    def all_account_users(self, obj):
        users = obj.get_all_account_users()
        return format_html("<br>".join(user.username for user in users))

    @admin.display(description="Other Accounts")
    def other_accounts(self, obj):
        accounts = obj.get_other_accounts()
        return format_html("<br>".join(account.name for account in accounts))

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("main_user", "account_user__iaso_profile__account")

    class Media:
        js = ("admin/js/vendor/select2/select2.full.min.js", "admin/js/autocomplete.js")
        css = {
            "all": ("admin/css/vendor/select2/select2.min.css",),
        }
