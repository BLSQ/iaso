from django.db import models

from iaso.models import Project, DataSource


class ImportGPKG(models.Model):
    """This file is mainly there to store the gpkg file for the import task"""

    UPLOADED_TO = "gpkg_import/"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    file = models.FileField(upload_to=UPLOADED_TO)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE)
    version_number = models.IntegerField(blank=True, null=True)
