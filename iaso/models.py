from django.db import models
from django.contrib.gis.db.models.fields import PointField, PolygonField

from django.contrib.postgres.fields import ArrayField, CITextField, JSONField

from iaso.utils import flat_parse_xml_file
from urllib.request import urlopen
from django.contrib.auth.models import User
from django.contrib.gis.geos import Point

GEO_SOURCE_CHOICES = (
    ("snis", "SNIS"),
    ("ucla", "UCLA"),
    ("pnltha", "PNL THA"),
    ("derivated", "Derivated from actual data"),
)


class Account(models.Model):
    name = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    users = models.ManyToManyField(User, blank=True)

    def __str__(self):
        return "%s " % (self.name,)


class Project(models.Model):
    name = models.TextField(null=True, blank=True)
    forms = models.ManyToManyField("Form", blank=True)
    account = models.ForeignKey(
        Account, on_delete=models.DO_NOTHING, null=True, blank=True
    )
    app_id = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s " % (self.name,)


class OrgUnitType(models.Model):
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sub_unit_types = models.ManyToManyField(
        "OrgUnitType", related_name="super_types", blank=True
    )

    projects = models.ManyToManyField(Project, related_name="unit_types", blank=True)

    def __str__(self):
        return "%s" % (self.name)

    def as_dict(self, sub_units=True, app_id=None):
        res = {
            "id": self.id,
            "name": self.name,
            "short_name": self.short_name,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
        }
        if sub_units:
            if not app_id:
                sub_unit_types = [
                    unit.as_dict(sub_units=False) for unit in self.sub_unit_types.all()
                ]
            else:
                sub_unit_types = [
                    unit.as_dict(sub_units=False)
                    for unit in self.sub_unit_types.filter(projects__app_id=app_id)
                ]
            res["sub_unit_types"] = sub_unit_types
        return res


class OrgUnit(models.Model):
    name = models.CharField(max_length=255)
    uuid = models.TextField(null=True, blank=True)
    custom = models.BooleanField(default=False)
    validated = models.BooleanField(default=True)
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
            "source": self.source,
            "source_ref": self.source_ref,
            "parent_id": self.parent_id,
            "org_unit_type_id": self.org_unit_type_id,
            "org_unit_type_name": self.org_unit_type.name
            if self.org_unit_type
            else None,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "aliases": self.aliases,
            "status": False if self.validated is None else self.validated,
            "latitude": self.location.x if self.location else self.longitude,
            "longitude": self.location.y if self.location else self.longitude,
            "has_geo_json": True if self.simplified_geom else False,
        }

    def as_dict_with_parents(self):
        return {
            "name": self.name,
            "short_name": self.name,
            "id": self.id,
            "source": self.source,
            "source_ref": self.source_ref,
            "parent": self.parent.as_dict_with_parents() if self.parent else None,
            "org_unit_type_id": self.org_unit_type_id,
            "org_unit_type_name": self.org_unit_type.name
            if self.org_unit_type
            else None,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "aliases": self.aliases,
            "status": False if self.validated is None else self.validated,
            "latitude": self.location.x if self.location else self.longitude,
            "longitude": self.location.y if self.location else self.longitude,
            "has_geo_json": True if self.simplified_geom else False,
        }

    def as_dict_for_csv(self):
        return {
            "name": self.name,
            "id": self.id,
            "source_ref": self.source_ref,
            "parent_id": self.parent_id,
            "org_unit_type": self.org_unit_type.name,
        }


class Form(models.Model):
    org_unit_types = models.ManyToManyField(OrgUnitType, blank=True)
    projects = models.ManyToManyField(Project, blank=True)
    form_id = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.TextField(null=True, blank=True)
    device_field = models.TextField(null=True, blank=True)
    location_field = models.TextField(null=True, blank=True)

    def __str__(self):
        return "%s %s " % (self.name, self.form_id)

    def as_dict(self, additional_fields=None):
        res = {
            "form_id": self.form_id,
            "name": self.name,
            "id": self.id,
            "org_unit_types": [t.as_dict() for t in self.org_unit_types.all()],
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp()
            if self.updated_at
            else self.created_at.timestamp(),
        }
        if additional_fields:
            for field in additional_fields:
                if hasattr(self, field):
                    res[field] = getattr(self, field)

        return res


class FormVersion(models.Model):
    UPLOADED_TO = "forms/"
    file = models.FileField(upload_to=UPLOADED_TO, null=True, blank=True)
    version_id = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Instance(models.Model):
    UPLOADED_TO = "instances/"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    uuid = models.TextField(null=True, blank=True)
    name = models.TextField(null=True, blank=True)
    file = models.FileField(upload_to=UPLOADED_TO, null=True, blank=True)
    file_name = models.TextField(null=True, blank=True)
    location = PointField(srid=4326, null=True)
    org_unit = models.ForeignKey(
        OrgUnit, on_delete=models.DO_NOTHING, null=True, blank=True
    )
    form = models.ForeignKey(Form, on_delete=models.DO_NOTHING, null=True, blank=True)
    json = JSONField(null=True, blank=True)
    accuracy = models.DecimalField(null=True, decimal_places=2, max_digits=7)
    device = models.ForeignKey(
        "Device", null=True, blank=True, on_delete=models.DO_NOTHING
    )

    def convert_location_from_field(self, field_name=None):
        f = field_name
        if f is None:
            f = self.form.location_field

        if self.json and f:
            location = self.json[f]
            if location:
                latitude, longitude, altitude, accuracy = [
                    float(x) for x in location.split(" ")
                ]
                self.location = Point(x=longitude, y=latitude, srid=4326)
                self.accuracy = accuracy
                self.save()

    def convert_device(self):
        if self.json and not self.device:
            imei = self.json.get("deviceid", None)
            if imei is not None:
                device, created = Device.objects.get_or_create(imei=imei)
                self.device = device
                self.save()

    def get_and_save_json_of_xml(self):
        if self.json:
            file_content = self.json
        elif self.file:
            if "amazonaws" in self.file.url:
                file = urlopen(self.file.url)
            else:
                file = self.file
            file_content = flat_parse_xml_file(file)
            self.json = file_content
            self.save()
        else:
            file_content = {}
        return file_content

    def __str__(self):
        return "%s %s" % (self.form, self.name)

    def as_dict(self):
        file_content = self.get_and_save_json_of_xml()

        return {
            "uuid": self.uuid,
            "file_name": self.file_name,
            "file_content": file_content,
            "file_url": self.file.url if self.file else None,
            "id": self.id,
            "form_id": self.form_id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "org_unit": self.org_unit.as_dict() if self.org_unit else None,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
        }

    def as_full_model(self):
        return {
            "id": self.id,
            "device_id": self.device.imei if self.device else None,
            "file_name": self.file_name,
            "file_url": self.file.url if self.file else None,
            "form_id": self.form_id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "org_unit": self.org_unit.as_dict_with_parents() if self.org_unit else None,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "files": [
                f.file.url if f.file else None for f in self.instancefile_set.all()
            ],
        }

    def as_location(self):
        return {
            "id": self.id,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
        }


class InstanceFile(models.Model):
    UPLOADED_TO = "instancefiles/"
    instance = models.ForeignKey(
        Instance, on_delete=models.DO_NOTHING, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.TextField(null=True, blank=True)
    file = models.FileField(upload_to=UPLOADED_TO, null=True, blank=True)

    def __str__(self):
        return "%s " % (self.name,)

    def as_dict(self):
        return {
            "form_id": self.form_id,
            "name": self.name,
            "id": self.id,
            "org_unit_types": [t.as_dict() for t in self.org_unit_types.all()],
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "file": self.file.url if self.file else None,
        }


class Device(models.Model):
    imei = models.CharField(max_length=20, null=True, blank=True)
    test_device = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s " % (self.imei,)

    def as_dict(self):
        return {
            "imei": self.imei,
            "test_device": self.test_device,
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
        }


class DeviceOwnership(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start = models.DateTimeField(auto_now_add=True)
    end = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s - %s" % (self.device, self.user)

    def as_dict(self):
        return {
            "device": self.device.as_dict(),
            "user": self.user.profile.as_short_dict(),
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
        }
