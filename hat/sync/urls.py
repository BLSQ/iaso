from django.urls import path

from . import views

urlpatterns = [path("form_upload/", views.form_upload, name="formupload")]
