from django.conf import settings
from django.conf.urls import url, include
from django.contrib import admin, auth
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static

admin.site.site_header = 'Administration de Trypelim.org'
admin.site.site_title = 'Trypelim'
admin.site.index_title = 'Administration de Trypelim.org'

urlpatterns = [
    url(r'^$', RedirectView.as_view(pattern_name='dashboard:home', permanent=False), name='index'),
    url(r'^accounts/', include('django.contrib.auth.urls')),
    url(r'^admin/', admin.site.urls),
    url(r'^api/', include('hat.api.urls')),
    url(r'^cases/', include('hat.cases.urls')),
    url(r'^dashboard/', include('hat.dashboard.urls')),
    url(r'^datasets/', include('hat.import_export.urls')),

    url(r'^login', auth.views.LoginView.as_view(template_name='login.html'), name='login'),
    url(r'^logout', auth.views.LogoutView.as_view(next_page='login'), name='logout'),
    url(r'^maintenance/', include('hat.maintenance.urls')),
    url(r'^quality/', include('hat.quality.urls')),
    url(r'^rq/', include('django_rq.urls')),
    url(r'^sync/', include('hat.sync.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.SHOW_DEBUG_TOOLBAR:
    import debug_toolbar
    urlpatterns += [
        url(r'^__debug__/', include(debug_toolbar.urls)),
    ]
