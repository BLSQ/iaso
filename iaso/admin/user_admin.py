from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as AuthUserAdmin
from django.contrib.auth.models import User
from django.contrib.gis import forms
from django.db import transaction
from django.db.models import Exists, F, OuterRef
from django.db.models.lookups import Exact
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import path

from iaso.admin.base import admin_attr_decorator
from iaso.models import Account, Profile, TenantUser


class MultiAccountForm(forms.Form):
    accounts = forms.ModelMultipleChoiceField(
        queryset=Account.objects.none(),  # Set empty queryset by default
        widget=forms.CheckboxSelectMultiple,
        required=True,
        label="Select Accounts",
    )

    def __init__(self, *args, **kwargs):
        existing_accounts = kwargs.pop("existing_accounts", [])
        super().__init__(*args, **kwargs)

        # Set the queryset to exclude existing accounts
        account_ids = [account.pk for account in existing_accounts]
        self.fields["accounts"].queryset = Account.objects.exclude(pk__in=account_ids)


class IsMultiAccountUserFilter(admin.SimpleListFilter):
    title = "multi-account user"
    parameter_name = "is_multi_account_user"

    def lookups(self, request, model_admin):
        return (("yes", "Yes"), ("no", "No"))

    def queryset(self, request, queryset):
        value = self.value()
        if value == "yes":
            return queryset.filter(annotated_is_account_user=True)
        if value == "no":
            return queryset.filter(annotated_is_account_user=False)
        return queryset


class IsMultiAccountMainUserFilter(admin.SimpleListFilter):
    title = "multi-account main user"
    parameter_name = "is_multi_account_main_user"

    def lookups(self, request, model_admin):
        return (("yes", "Yes"), ("no", "No"))

    def queryset(self, request, queryset):
        value = self.value()
        if value == "yes":
            return queryset.filter(annotated_is_account_main_user=True)
        if value == "no":
            return queryset.filter(annotated_is_account_main_user=False)
        return queryset


@admin_attr_decorator
class UserAdmin(AuthUserAdmin):
    list_display = ("id",) + AuthUserAdmin.list_display + ("is_account_user", "is_account_main_user", "accounts")
    list_filter = (IsMultiAccountUserFilter, IsMultiAccountMainUserFilter) + AuthUserAdmin.list_filter
    list_display_links = ("id", "username")
    ordering = ("-id",)

    def get_queryset(self, request):
        is_main_user = TenantUser.objects.filter(main_user_id=OuterRef("pk"))
        return (
            super()
            .get_queryset(request)
            .select_related("iaso_profile__account", "tenant_user")
            .prefetch_related("tenant_users")
            .annotate(annotated_is_account_user=Exact(F("id"), F("tenant_user__account_user_id")))
            .annotate(annotated_is_account_main_user=Exists(is_main_user))
        )

    def is_account_user(self, obj):
        return obj.annotated_is_account_user

    is_account_user.boolean = True
    is_account_user.short_description = "multi-account user"
    is_account_user.admin_order_field = "annotated_is_account_user"

    def is_account_main_user(self, obj):
        return obj.annotated_is_account_main_user

    is_account_main_user.boolean = True
    is_account_main_user.short_description = "multi-account main user"
    is_account_main_user.admin_order_field = "annotated_is_account_main_user"

    def accounts(self, user):
        if user.tenant_users.exists():  # Multi-account user
            return [
                tu.account_user.iaso_profile and tu.account_user.iaso_profile.account.name
                for tu in user.tenant_users.all()
            ]
        # Regular user
        return user.iaso_profile and user.iaso_profile.account

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<int:user_id>/edit-multi-account/",
                self.admin_site.admin_view(self.edit_multi_account_user),
                name="edit-multi-account",
            ),
        ]
        return custom_urls + urls

    def edit_multi_account_user(self, request, user_id):
        user = get_object_or_404(User, pk=user_id)

        if request.method == "POST":
            form = MultiAccountForm(request.POST)
            if form.is_valid():
                if hasattr(user, "iaso_profile") and not user.tenant_users.exists():
                    # If user is not yet multi-account: Move existing account to
                    # tenant_user structure
                    existing_profile = user.iaso_profile
                    existing_account = existing_profile.account
                    new_account_user = self._create_new_account_user_for(user, existing_account)
                    existing_profile.user = new_account_user
                    existing_profile.save()
                    TenantUser.objects.create(
                        main_user=user,
                        account_user=new_account_user,
                    )

                for account in form.cleaned_data["accounts"]:
                    with transaction.atomic():
                        new_account_user = self._create_new_account_user_for(user, account)
                        Profile.objects.create(account=account, user=new_account_user)
                        TenantUser.objects.create(
                            main_user=user,
                            account_user=new_account_user,
                        )

                messages.success(
                    request,
                    f"User {user.username} has been linked to selected accounts.",
                )
                return redirect("admin:auth_user_change", user.id)

            return redirect("admin:auth_user_change", user_id=user.id)

        if user.tenant_users.exists():  # Multi-account user
            linked_accounts = [
                tu.account_user.iaso_profile and tu.account_user.iaso_profile.account for tu in user.tenant_users.all()
            ]
        elif hasattr(user, "iaso_profile"):  # Regular user
            linked_accounts = [user.iaso_profile.account]
        else:
            linked_accounts = []
        form = MultiAccountForm(existing_accounts=linked_accounts)

        return render(
            request,
            "admin/edit_multi_account_user.html",
            {"form": form, "user": user},
        )

    def _create_new_account_user_for(self, user, account):
        return User.objects.create(
            username=f"{user.username}_account_{str(account.id)}",
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            is_superuser=user.is_superuser,
            is_staff=user.is_staff,
        )
