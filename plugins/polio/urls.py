from django.urls import path

from .views import refresh_preparedness_data

urlpatterns = [path("refresh_preparedness_data/<launcher_user_id>/", refresh_preparedness_data)]
