from django.contrib import messages
from django.contrib.auth.admin import UserAdmin as AuthUserAdmin
from django.contrib.auth.models import User
from django.contrib.gis import forms
from django.db import transaction
from django.db.models import Exists, OuterRef
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


@admin_attr_decorator
class UserAdmin(AuthUserAdmin):
    list_display = AuthUserAdmin.list_display + ("accounts",)

    def accounts(self, user):
        if user.tenant_users.exists():  # Multi-account user
            return [
                tu.account_user.iaso_profile and tu.account_user.iaso_profile.account.name
                for tu in user.tenant_users.all()
            ]
        # Regular user
        return user.iaso_profile and user.iaso_profile.account

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.prefetch_related(
            "iaso_profile__account",
            "tenant_users__account_user__iaso_profile__account",
        )

        # If request is for list, hide the multi-account "account_users".
        # That way we only show regular + main multi-account users.
        # Don't filter for edit screen so we can still access via /tenantuser.
        if request.resolver_match.url_name == "auth_user_changelist":
            queryset = queryset.annotate(
                has_tenant_user=Exists(TenantUser.objects.filter(account_user=OuterRef("pk")))
            ).filter(has_tenant_user=False)

        return queryset

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
                tu.account_user.iaso_profile and tu.account_user.iaso_profile.account
                for tu in user.tenant_users.all()
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
