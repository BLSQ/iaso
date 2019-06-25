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
    sub_unit_types = models.ManyToManyField(
        "OrgUnitType", related_name="super_types", blank=True
    )

    def __str__(self):
        return "%s" % (self.name)

    def as_dict(self, sub_units=True):
        res = {
            "id": self.id,
            "name": self.name,
            "short_name": self.short_name,
            "created_at": self.created_at.timestamp(),
            "updated_at": self.updated_at.timestamp(),
        }
        if sub_units:
            sub_unit_types = [
                unit.as_dict(sub_units=False) for unit in self.sub_unit_types.all()
            ]
            res["sub_unit_types"] = sub_unit_types
        return res


class OrgUnit(models.Model):
    name = models.CharField(max_length=255)
    parent = models.ForeignKey(
        "OrgUnit", on_delete=models.CASCADE, null=True, blank=True
    )
    aliases = ArrayField(
        CITextField(max_length=255, blank=True), size=100, null=True, blank=True
    )

    org_unit_type = models.ForeignKey(
        OrgUnitType, on_delete=models.CASCADE, null=True, blank=True
    )

    source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True, blank=True)
    source_ref = models.TextField(null=True, blank=True)
    geom = PolygonField(srid=4326, null=True, blank=True)
    simplified_geom = PolygonField(srid=4326, null=True, blank=True)
    geom_source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True, blank=True)
    geom_ref = models.IntegerField(null=True, blank=True)

    latitude = models.DecimalField(
        max_digits=10, decimal_places=8, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=11, decimal_places=8, null=True, blank=True
    )
    gps_source = models.TextField(
        null=True, blank=True
    )  # much more diverse than above GEO_SOURCE_CHOICES
    location = PointField(srid=4326, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s %s " % (self.org_unit_type, self.name)

    def as_dict(self):
        return {
            "name": self.name,
            "short_name": self.name,
            "id": self.id,
            "source_ref": self.source_ref,
            "parent_id": self.parent_id,
            "org_unit_type_id": self.org_unit_type_id,
            "created_at": self.created_at.timestamp(),
            "updated_at": self.updated_at.timestamp(),
            "aliases": self.aliases,
        }


class Form(models.Model):
    UPLOADED_TO = "forms/"
    org_unit_types = models.ManyToManyField(OrgUnitType, blank=True)
    form_id = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.TextField(null=True, blank=True)
    file = models.FileField(upload_to=UPLOADED_TO, null=True, blank=True)

    def __str__(self):
        return "%s %s " % (self.name, self.form_id)

    def as_dict(self):
        return {
            "form_id": self.form_id,
            "name": self.name,
            "id": self.id,
            "org_unit_types": [t.as_dict() for t in self.org_unit_types.all()],
            "created_at": self.created_at.timestamp(),
            "updated_at": self.updated_at.timestamp(),
            "file": self.file.url if self.file else None,
        }
