from django.conf.urls import url, include
from django.contrib import admin, auth

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^accounts/', include('django.contrib.auth.urls')),
    url(r'^login', auth.views.login, {'template_name': 'login.html'}, name='login'),
    url(r'^logout', auth.views.logout, {'next_page': 'login'}, name='logout'),
    url(r'^', include('hat.dashboard.urls', 'dashboard')),
]
