from django.conf.urls import url, include
from django.contrib import admin, auth
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static
from iaso.views import page, health

admin.site.site_header = "Administration de Iaso"
admin.site.site_title = "Iaso"
admin.site.index_title = "Administration de Iaso"

urlpatterns = [
    url(r"^$", RedirectView.as_view(pattern_name="dashboard:iaso", permanent=False), name="index"),
    url(r"^accounts/", include("django.contrib.auth.urls")),
    url(r"^_health/", health),
    url(r"^admin/", admin.site.urls),
    url(r"^api/", include("iaso.urls")),
    # url(r"^api/", include("hat.api.urls")),
    url(r"^pages/(?P<page_slug>[a-z0-9-]+)/$", page, name="pages"),
    url(r"^dashboard/", include("hat.dashboard.urls")),
    url(r"^login/", auth.views.LoginView.as_view(template_name="iaso/login.html"), name="login"),
    url(r"^logout-iaso", auth.views.LogoutView.as_view(next_page="login"), name="logout-iaso"),
    url(
        r"^forgot-password/",
        auth.views.PasswordResetView.as_view(
            template_name="iaso/forgot_password.html",
            email_template_name="iaso/reset_password_email.html",
            subject_template_name="iaso/reset_password_subject.txt",
            success_url="/forgot-password-confirmation/",
        ),
        name="forgot_password",
    ),
    url(
        r"^forgot-password-confirmation/",
        auth.views.PasswordResetDoneView.as_view(template_name="iaso/forgot_password_confirmation.html"),
        name="forgot_password_confirmation",
    ),
    url(
        r"^reset-password-confirmation/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/",
        auth.views.PasswordResetConfirmView.as_view(
            template_name="iaso/reset_password_confirmation.html", success_url="/reset-password-complete/"
        ),
        name="reset_password_confirmation",
    ),
    url(
        r"^reset-password-complete/",
        auth.views.PasswordResetCompleteView.as_view(template_name="iaso/reset_password_complete.html"),
        name="reset_password_complete",
    ),
    url(r"^sync/", include("hat.sync.urls")),
]

if settings.BEANSTALK_WORKER or settings.DEBUG:
    urlpatterns.append(url(r"^tasks/", include("beanstalk_worker.urls")))

if settings.PLUGIN_POLIO_ENABLED:
    urlpatterns.append(url(r"^dashboard/polio/list", include("plugins.polio.urls")))

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
