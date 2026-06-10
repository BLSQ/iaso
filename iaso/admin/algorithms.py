from django.contrib.gis import admin
from django.db import models

from iaso.admin.utils import IasoJSONEditorWidget
from iaso.models import AlgorithmRun, MatchingAlgorithm


@admin.register(AlgorithmRun)
class AlgorithmRunAdmin(admin.ModelAdmin):
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}


@admin.register(MatchingAlgorithm)
class MatchingAlgorithmAdmin(admin.ModelAdmin):
    pass
