import importlib

from importlib import import_module

import django_sql_dashboard  # type: ignore

from django.apps import apps
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin, auth
from django.shortcuts import render
from django.urls import include, path
from django.views.generic import RedirectView, TemplateView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from hat.sso_views import SSOCallbackView, SSOLoginView, get_adapter_class, make_token_view
from iaso.auth.views import IasoLogoutView, IasoPasswordResetView
from iaso.views import ModelDataView, health, health_clamav, page, robots_txt


def _sso_providers():
    from allauth.socialaccount import providers as allauth_providers
    from django.urls import NoReverseMatch, reverse

    result = []
    for provider in allauth_providers.registry.get_list():
        try:
            result.append({"name": provider.name, "login_url": reverse(f"{provider.id}_login")})
        except NoReverseMatch:
            pass
    return result


def get_sso_urlpatterns():
    """Generate URL patterns for all configured SSO providers."""
    patterns = []
    # Always register this name: allauth's render_authentication_error() reverses it
    # when the user cancels login on the provider's side. This project doesn't include
    # allauth's own account/socialaccount urls (it has its own login system), so without
    # this the cancelled-login case crashes with NoReverseMatch.
    #
    # Must not be gated on SSO_PROVIDERS: WFP is configured via WFP_AUTH_CLIENT_ID and
    # is never added to SSO_PROVIDERS, but its callback uses the same allauth helper.
    patterns.append(
        path(
            "accounts/login/cancelled/",
            RedirectView.as_view(url=settings.LOGIN_URL),
            name="socialaccount_login_cancelled",
        )
    )
    for provider_id, config in getattr(settings, "SSO_PROVIDERS", {}).items():
        adapter_cls = get_adapter_class(provider_id)

        login_path = config.get("login_path", f"{provider_id}/login/")
        callback_path = config.get("callback_path", f"{provider_id}/login/callback/")
        token_path = config.get("token_path", f"{provider_id}/token/")

        patterns += [
            path(login_path, SSOLoginView.adapter_view(adapter_cls), name=f"{provider_id}_login"),
            path(callback_path, SSOCallbackView.adapter_view(adapter_cls), name=f"{provider_id}_callback"),
            path(token_path, make_token_view(provider_id), name=f"{provider_id}_token"),
        ]
    return patterns


class LoginView(auth.views.LoginView):
    def get_context_data(self, **kwargs):
        return {**super().get_context_data(**kwargs), "sso_providers_for_login": _sso_providers()}


class TemplateLoginView(TemplateView):
    def get_context_data(self, **kwargs):
        return {**super().get_context_data(**kwargs), "sso_providers_for_login": _sso_providers()}


admin.site.site_header = "Administration de Iaso"
admin.site.site_title = "Iaso"
admin.site.index_title = "Administration de Iaso"


if settings.MAINTENANCE_MODE:
    urlpatterns = [
        path("_health/", health),
        path("_health", health),  # same without slash otherwise AWS complain about redirect
        path("health/", health),  # alias since current apache config hide _health/
        path("health-clamav/", health_clamav),
    ]

    def custom_404_view(request, exception):
        return render(request, "iaso/maintenance.html", {}, status=404)

    handler404 = custom_404_view
else:
    if settings.DISABLE_PASSWORD_LOGINS:
        login_template = "iaso/disabled_password_login.html"
        urlpatterns = [
            path("admin/login/", TemplateLoginView.as_view(template_name=login_template), name="admin-login"),
            path("login/", TemplateLoginView.as_view(template_name=login_template), name="login"),
        ]
    else:
        from iaso.auth.forms import AxesAuthenticationForm

        login_template = "iaso/login.html"
        urlpatterns = [
            path(
                "admin/login/",
                LoginView.as_view(template_name=login_template, authentication_form=AxesAuthenticationForm),
                name="admin-login",
            ),
            path(
                "login/",
                LoginView.as_view(template_name=login_template, authentication_form=AxesAuthenticationForm),
                name="login",
            ),
        ]

    if settings.ACTIVATE_SOCIAL_ACCOUNT:
        # ------------------ adding urls of allauth for social account ------------------
        # this snippet is lifted from allauth.account.urls.py. It's the only way I found to ONLY load the features we need
        # It means that with the current allauth version, only the following urls will be added (for a WFP account):
        # /accounts/wfp/login/	allauth.socialaccount.providers.oauth2.views.view	wfp_login
        # /accounts/wfp/login/callback/	allauth.socialaccount.providers.oauth2.views.view	wfp_callback
        # /accounts/wfp/token/	plugins.wfp_auth.views.token_view	wfp_token
        from allauth.socialaccount import providers

        # Provider urlpatterns, as separate attribute (for reusability).
        provider_urlpatterns = []
        for provider in providers.registry.get_list():
            try:
                prov_mod = import_module(provider.get_package() + ".urls")
            except ImportError:
                continue
            prov_urlpatterns = getattr(prov_mod, "urlpatterns", None)
            if prov_urlpatterns:
                provider_urlpatterns += prov_urlpatterns
        urlpatterns += [path("accounts/", include(provider_urlpatterns))]

    urlpatterns += [
        path("robots.txt", robots_txt),
        path(
            "",
            RedirectView.as_view(pattern_name=settings.ROOT_REDIRECT_PATTERN_NAME, permanent=False),
            name="index",
        ),
        path("_health/", health),
        path("_health", health),  # same without slash otherwise AWS complain about redirect
        path("health/", health),  # alias since current apache config hide _health/
        path("health-clamav/", health_clamav),
        path("admin/", admin.site.urls),
        path("api/", include("iaso.urls")),
        path("api/etl/", include(("iaso.urls_etl", "api-etl"), namespace="api-etl")),
        path("pages/<page_slug>/", page, name="pages"),
        path("i18n/", include("django.conf.urls.i18n")),
        path("logout-iaso", IasoLogoutView.as_view(), name="logout-iaso"),
        path(
            "forgot-password/",
            IasoPasswordResetView.as_view(
                template_name="iaso/forgot_password.html",
                email_template_name="iaso/reset_password_email.txt",
                html_email_template_name="iaso/reset_password_email.html",
                subject_template_name="iaso/reset_password_subject.txt",
                success_url="/forgot-password-confirmation/",
            ),
            name="forgot_password",
        ),
        path(
            "forgot-password-confirmation/",
            auth.views.PasswordResetDoneView.as_view(template_name="iaso/forgot_password_confirmation.html"),
            name="forgot_password_confirmation",
        ),
        path(
            "reset-password-confirmation/<uidb64>/<token>/",
            auth.views.PasswordResetConfirmView.as_view(
                template_name="iaso/reset_password_confirmation.html", success_url="/reset-password-complete/"
            ),
            name="reset_password_confirmation",
        ),
        path(
            "reset-password-complete/",
            auth.views.PasswordResetCompleteView.as_view(template_name="iaso/reset_password_complete.html"),
            name="reset_password_complete",
        ),
        path("sync/", include("hat.sync.urls")),
        path("models/", ModelDataView.as_view(), name="models"),
    ]

    if getattr(settings, "MCP_ENABLED", False):
        urlpatterns += [path("", include("iaso.mcp.urls"))]

    for plugin_name in settings.PLUGINS:
        urls_module_name = "plugins." + plugin_name + ".urls"
        urls_module = importlib.util.find_spec(urls_module_name)  # checking if the urls module exists for this plugin

        if urls_module:
            urlpatterns = urlpatterns + [
                path(plugin_name + "/", include(urls_module_name)),
            ]
        else:
            print(f"URL module not found for plugin: {plugin_name}")

    # swagger
    urlpatterns += [
        path("swagger/", SpectacularAPIView.as_view(), name="swagger-schema"),
        # Optional UI:
        path("swagger-ui/", SpectacularSwaggerView.as_view(url_name="swagger-schema"), name="swagger-ui"),
        path("redoc/", SpectacularRedocView.as_view(url_name="swagger-schema"), name="redoc"),
    ]

    if settings.BEANSTALK_WORKER or settings.DEBUG or settings.IN_TESTS:
        urlpatterns.append(path("tasks/", include("beanstalk_worker.urls")))

    if apps.is_installed("django_sql_dashboard"):
        from django_sql_dashboard_export.views import export_sql_results_for_dashboard

        urlpatterns.append(path("explore/", include(django_sql_dashboard.urls)))
        urlpatterns.append(path("explore/<slug>/export/", export_sql_results_for_dashboard))

    urlpatterns.append(path("dashboard/", include("hat.dashboard.urls")))

    urlpatterns += static(settings.MEDIA_URL_PREFIX, document_root=settings.MEDIA_ROOT)

    if settings.DEBUG and "debug_toolbar" in settings.INSTALLED_APPS:
        urlpatterns = [path("__debug__/", include("debug_toolbar.urls"))] + urlpatterns

    urlpatterns += get_sso_urlpatterns()
