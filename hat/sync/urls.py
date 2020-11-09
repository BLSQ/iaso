from django.conf.urls import url
from . import views


urlpatterns = [url(r"^form_upload/$", views.form_upload, name="formupload")]
