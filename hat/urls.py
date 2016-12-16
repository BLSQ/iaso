from django.conf import settings
from django.conf.urls import url, include
from django.contrib import admin, auth
from django.views.generic import RedirectView

urlpatterns = [
    url(r'^api/', include('hat.api.urls', 'api')),
    url(r'^admin/', admin.site.urls),
    url(r'^rq/', include('django_rq.urls')),
    url(r'^accounts/', include('django.contrib.auth.urls')),
    url(r'^login', auth.views.login, {'template_name': 'login.html'}, name='login'),
    url(r'^logout', auth.views.logout, {'next_page': 'login'}, name='logout'),
    url(r'^$', RedirectView.as_view(pattern_name='dashboard:home', permanent=False), name='index'),
    url(r'^datasets/', include('hat.import_export.urls', 'datasets')),
    url(r'^maintenance/', include('hat.maintenance.urls', 'maintenance')),
    url(r'^dashboard/', include('hat.dashboard.urls', 'dashboard')),
    url(r'^playground/', include('hat.playground.urls', 'playground')),
]

if settings.SHOW_DEBUG_TOOLBAR:
    import debug_toolbar
    urlpatterns += [
        url(r'^__debug__/', include(debug_toolbar.urls)),
    ]
