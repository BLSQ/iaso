from django.urls import path

from .views import refresh_preparedness_data

urlpatterns = [path("refresh_preparedness_data/<launcher_username>/", refresh_preparedness_data)]
