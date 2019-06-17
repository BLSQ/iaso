from django.db import models
from django.contrib.gis.db.models.fields import (
    MultiPolygonField,
    PointField,
    PolygonField,
)
from django.contrib.postgres.fields import ArrayField, CITextField

GEO_SOURCE_CHOICES = (
    ("snis", "SNIS"),
    ("ucla", "UCLA"),
    ("pnltha", "PNL THA"),
    ("derivated", "Derivated from actual data"),
)


class OrgUnitType(models.Model):
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s" % (self.name)

    def as_dict(self):
        return {"id": self.id, "name": self.name}


class OrgLevel(models.Model):
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=255)
    level = models.IntegerField()
    parent = models.ForeignKey("OrgLevel", on_delete=models.CASCADE)
    org_unit_type = models.ForeignKey(OrgUnitType, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s" % (self.name)

    def as_dict(self):
        return {"id": self.id, "name": self.name}


class OrgUnit(models.Model):
    name = models.CharField(max_length=255)
    parent = models.ForeignKey("OrgUnit", on_delete=models.CASCADE)
    aliases = ArrayField(
        CITextField(max_length=255, blank=True), size=100, null=True, blank=True
    )
    org_unit_type = models.ForeignKey(OrgUnitType, on_delete=models.CASCADE)
    source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True)
    source_ref = models.TextField(null=True)
    geom = PolygonField(srid=4326, null=True)
    simplified_geom = PolygonField(srid=4326, null=True)
    geom_source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True)
    geom_ref = models.IntegerField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s" % (self.name)

    def as_dict(self):
        return {"id": self.id, "name": self.name}
