from gettext import ngettext

from django import forms
from django.contrib import messages
from django.contrib.admin import SimpleListFilter
from django.contrib.admin.widgets import AdminSplitDateTime
from django.contrib.gis import admin
from django.db import models
from django_admin_action_forms import AdminActionForm, AdminActionFormsMixin, action_with_form

from iaso.admin.utils import IasoJSONEditorWidget, create_indexes_action
from iaso.models import Account, AccountFeatureFlag
from iaso.plugins import is_wfp_plugin_active


class DecadeBornListFilter(SimpleListFilter):
    # Human-readable title which will be displayed in the
    # right admin sidebar just above the filter options.
    title = "is disabled"
    parameter_name = "is_disabled"

    def lookups(self, request, model_admin):
        """
        Returns a list of tuples. The first element in each
        tuple is the coded value for the option that will
        appear in the URL query. The second element is the
        human-readable name for the option that will appear
        in the right sidebar.
        """
        return [("True", True), ("False", False)]

    def queryset(self, request, queryset):
        """
        Returns the filtered queryset based on the value
        provided in the query string and retrievable via
        `self.value()`.
        """
        # Compare the requested value (either '80s' or '90s')
        # to decide how to filter the queryset.
        if self.value() == "True":
            return queryset.only_disabled_accounts()
        if self.value() == "False":
            return queryset.exclude_disabled_accounts()
        return queryset


class ConfirmReactivateActionForm(AdminActionForm):
    # No fields needed

    class Meta:
        list_objects = True
        help_text = "Are you sure you want proceed with this action?"


class DisableAtActionForm(AdminActionForm):
    date = forms.SplitDateTimeField(required=True, widget=AdminSplitDateTime)

    class Meta:
        list_objects = True


@admin.register(AccountFeatureFlag)
class AccountFeatureFlagAdmin(admin.ModelAdmin):
    pass


@admin.register(Account)
class AccountAdmin(AdminActionFormsMixin, admin.ModelAdmin):
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
    search_fields = ["name", "id"]
    list_display = ["name", "created_at", "updated_at", "disabled_at", "is_active"]
    list_filter = [DecadeBornListFilter]
    autocomplete_fields = ["default_version"]
    actions = [create_indexes_action, "reactivate_accounts", "disable_at"]
    if is_wfp_plugin_active():
        from plugins.wfp.admin import create_indexes_celery_action

        actions.append(create_indexes_celery_action)

    @action_with_form(ConfirmReactivateActionForm, description="Reactivate accounts")
    def reactivate_accounts(self, request, queryset, data):
        # todo : side effects to this ?
        updated = queryset.update(disabled_at=None)
        self.message_user(
            request,
            ngettext(
                "%d account were successfully reactivated.",
                "%d accounts were successfully reactivated.",
                updated,
            )
            % updated,
            messages.SUCCESS,
        )

    @action_with_form(DisableAtActionForm, description="Disable accounts selected")
    def disable_at(self, request, queryset, data):
        # todo : side effects to this ?
        updated = queryset.update(disabled_at=data["date"])
        self.message_user(
            request,
            ngettext(
                "%d account were successfully set to be disabled at %s.",
                "%d accounts were successfully set to be disabled at %s.",
                updated,
            )
            % (updated, data["date"]),
            messages.SUCCESS,
        )
