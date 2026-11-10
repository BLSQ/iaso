from django.contrib import admin
from django.forms import ModelForm
from django.forms.widgets import PasswordInput

from iaso.models import StoragePassword


class PasswordRevealInput(PasswordInput):
    template_name = "admin/iaso/widget/password-reveal-input.html"

    class Media:
        js = ("js/admin-password-reveal-widget.js",)

    def __init__(self, attrs=None, render_value=True):
        super().__init__(attrs, render_value=render_value)


class StoragePasswordForm(ModelForm):
    class Meta:
        model = StoragePassword
        fields = "__all__"
        widgets = {"password": PasswordRevealInput()}


@admin.register(StoragePassword)
class StoragePasswordAdmin(admin.ModelAdmin):
    form = StoragePasswordForm
    fields = (
        "password",
        "is_compromised",
        "project",
        "created_at",
        "updated_at",
    )
    readonly_fields = ("created_at", "updated_at")
    list_display = ("project", "is_compromised")
    list_filter = ("project", "is_compromised")
