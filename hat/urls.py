from django.conf.urls import url, include
from django.contrib import admin, auth
from hat.home.views import index

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^accounts/', include('django.contrib.auth.urls')),
    url(r'^historic/', include('hat.historic.urls', 'historic')),
    url(r'^$', index, name='index'),
    url(r'^login', auth.views.login, {'template_name': 'login.html'}, name='login'),
    url(r'^logout', auth.views.logout, {'next_page': 'login'}, name='logout'),
]
