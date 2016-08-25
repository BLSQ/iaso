from django.conf.urls import url, include
from django.contrib import admin, auth
from django.views.generic.base import RedirectView


urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^accounts/', include('django.contrib.auth.urls')),
    url(r'^login', auth.views.login, {'template_name': 'login.html'}, name='login'),
    url(r'^logout', auth.views.logout, {'next_page': 'login'}, name='logout'),
    url(r'^$', RedirectView.as_view(pattern_name='import_export:index'), name='index'),
    url(r'^import_export/', include('hat.import_export.urls', 'import_export')),
    url(r'^maintenance/', include('hat.maintenance.urls', 'maintenance')),
    url(r'^dashboard/', include('hat.dashboard.urls', 'dashboard')),
]
