from django.conf.urls import url, include
from django.contrib import admin, auth
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static

admin.site.site_header = "Administration de Iaso"
admin.site.site_title = "Iaso"
admin.site.index_title = "Administration de Iaso"

urlpatterns = [
    url(r"^$", RedirectView.as_view(pattern_name="dashboard:iaso", permanent=False), name="index"),
    url(r"^accounts/", include("django.contrib.auth.urls")),
    url(r"^admin/", admin.site.urls),
    url(r"^api/", include("iaso.urls")),
    # url(r"^api/", include("hat.api.urls")),
    url(r"^dashboard/", include("hat.dashboard.urls")),
    url(r"^login/", auth.views.LoginView.as_view(template_name="iaso/login.html"), name="login"),
    url(r"^logout-iaso", auth.views.LogoutView.as_view(next_page="login"), name="logout-iaso"),
    url(r"^sync/", include("hat.sync.urls")),
]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
