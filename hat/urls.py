import django_sql_dashboard  # type: ignore
from django.apps import apps
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin, auth
from django.urls import include, path, re_path
from django.views.generic import RedirectView
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

from iaso.views import health, page


admin.site.site_header = "Administration de Iaso"
admin.site.site_title = "Iaso"
admin.site.index_title = "Administration de Iaso"

urlpatterns = [
    path("", RedirectView.as_view(pattern_name="dashboard:iaso", permanent=False), name="index"),
    path("_health/", health),
    path("_health", health),  # same without slash otherwise AWS complain about redirect
    path("health/", health),  # alias since current apache config hide _health/
    path("accounts/", include("django.contrib.auth.urls")),
    path("accounts/", include("allauth.urls")),
    path("admin/", admin.site.urls),
    path("api/", include("iaso.urls")),
    path("pages/<page_slug>/", page, name="pages"),
    path("i18n/", include("django.conf.urls.i18n")),
    path("login/", auth.views.LoginView.as_view(template_name="iaso/login.html"), name="login"),
    path("logout-iaso", auth.views.LogoutView.as_view(next_page="login"), name="logout-iaso"),
    path(
        "forgot-password/",
        auth.views.PasswordResetView.as_view(
            template_name="iaso/forgot_password.html",
            email_template_name="iaso/reset_password_email.html",
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
]

# Swagger config
schema_view = get_schema_view(
    openapi.Info(
        title="Iaso",
        default_version="v1",
        description="Iaso Swagger",
    ),
    public=False,
    urlconf="hat.urls",
    permission_classes=(permissions.IsAdminUser,),
)

urlpatterns = urlpatterns + [
    re_path(r"^swagger(?P<format>\.json|\.yaml)$", schema_view.without_ui(cache_timeout=0), name="schema-json"),
    re_path(r"^swagger/$", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    re_path(r"^redoc/$", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
]

if settings.BEANSTALK_WORKER or settings.DEBUG or settings.IN_TESTS:
    urlpatterns.append(path("tasks/", include("beanstalk_worker.urls")))

if apps.is_installed("django_sql_dashboard"):
    from django_sql_dashboard_export.views import export_sql_results_for_dashboard

    urlpatterns.append(path("explore/", include(django_sql_dashboard.urls)))
    urlpatterns.append(path("explore/<slug>/export/", export_sql_results_for_dashboard))

urlpatterns.append(path("dashboard/", include("hat.dashboard.urls")))

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
