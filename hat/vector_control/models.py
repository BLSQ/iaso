from django.contrib.auth.models import User
from django.contrib.gis.db.models.fields import PointField
from django.db import models
import uuid
from django.contrib.postgres.fields import JSONField

from django.db.models import CASCADE, SET_NULL

SOURCE_CHOICES = (
    ('excel', 'Excel'),
    ('API', 'API'),
)

HABITAT_CHOICES = (
    ("bush", "Buisson"),
    ("fish_pond", "Etang à poissons"),
    ("farm", "Ferme"),
    ("forest", "Forêt"),
    ("unknown", 'Inconnu'),
    ("lake", "Lac"),
    ("river", "Rivière"),
    ("road", "Route"),
    ("stream", "Ruisseau")
)

IMPORT_TYPE = (
    ("trap", "Trap"),
    ("site", "Site"),
    ("catch", "Catch"),
    ("target", "Target")
)


class APIImport(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=CASCADE, null=True)  # Null only when importing from CLI
    import_type = models.TextField(max_length=25, choices=IMPORT_TYPE,  null=True, blank=True)
    json_body = JSONField()

    def __str__(self):
        return "%s - %s - %s - %s" % (self.id, self.user, self.import_type, self.created_at)

    def as_dict(self):
        res = {
            'id': self.id,
            'user': self.user.username,
            'created_at': self.created_at,
            'type': self.import_type
        }

        if self.import_type == 'trap':
            res['trap_count'] = self.trap_set.count()
        elif self.import_type == 'catch':
            res['catch_count'] = self.catch_set.count()
        elif self.import_type == 'target':
            res['target_count'] = self.target_set.count()
        return res


class Site(models.Model):
    name = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    uuid = models.TextField(null=True, blank=True)
    location = PointField(srid=4326, null=True, dim=3)
    accuracy = models.DecimalField(null=True, decimal_places=2, max_digits=7)
    ignore = models.BooleanField(default=False)
    api_import = models.ForeignKey(APIImport, null=True, on_delete=CASCADE, blank=True)
    responsible = models.ForeignKey(User, null=True, blank=True, on_delete=SET_NULL)

    def __str__(self):
        return "%s - %s - %s" % (self.id, self.name, self.location)

    def as_dict(self, additional_fields=None):
        username = None
        if self.responsible:
            username = self.responsible.username

        res = {
            'id': self.id,
            'name': self.name,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'username': username,
            'uuid': self.uuid,
            'latitude': self.location.y,
            'longitude': self.location.x,
            'altitude': self.location.z,
            'user': username,
            'accuracy': self.accuracy,
            'ignore': self.ignore
        }

        # include fields that were added through annotate
        if additional_fields:
            for field in additional_fields:
                if hasattr(self, field):
                    res[field] = getattr(self, field)

        return res


class Trap(models.Model):
    name = models.CharField(max_length=50, null=True)
    accuracy = models.DecimalField(null=True, decimal_places=2, max_digits=7)
    habitat = models.TextField(max_length=255, choices=HABITAT_CHOICES,  null=True, blank=True)
    description = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(null=True)
    updated_at = models.DateTimeField(auto_now=True)
    total = models.IntegerField(default=0)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.DO_NOTHING)
    uuid = models.TextField(unique=True, default=uuid.uuid4)
    source = models.TextField(choices=SOURCE_CHOICES, null=True, default='excel')
    is_reference = models.BooleanField(default=False)
    location = PointField(srid=4326, null=True, dim=3)
    ignore = models.BooleanField(default=False)
    api_import = models.ForeignKey(APIImport, null=True, on_delete=CASCADE)

    def __str__(self):
        return "%s - %s - %s" % (self.id, self.name, self.location)

    def as_location(self):
        try:
            latest_catch = Catch.objects.filter(trap_id=self.id).order_by('-collect_date').last().as_dict()
        except:
            latest_catch = None
        return {
            'id': self.id,
            'latitude': self.location.y,
            'longitude': self.location.x,
            'altitude': self.location.z,
            'latest_catch': latest_catch
    }

    def as_dict(self, additional_fields=None):
        latitude = 0
        longitude = 0
        altitude = 0
        try:
            latest_catch = Catch.objects.filter(trap_id = self.id).order_by('-collect_date').last().as_dict()
        except:
            latest_catch = None
        if self.location:
            latitude = self.location.y
            longitude = self.location.x
            altitude = self.location.z
        username = None
        if self.user:
            username = self.user.username
        res = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'habitat': self.habitat,
            'created_at': self.created_at,
            'username': username,
            'is_reference': self.is_reference,
            'ignore': self.ignore,
            'latitude': latitude,
            'longitude': longitude,
            'altitude': altitude,
            'user': username,
            'accuracy': self.accuracy,
            'source': self.source,
            'latest_catch': latest_catch
        }

        # include fields that were added through annotate
        if additional_fields:
            for field in additional_fields:
                if hasattr(self, field):
                    res[field] = getattr(self, field)

        return res


class Catch(models.Model):
    trap = models.ForeignKey(Trap, on_delete=models.CASCADE)
    setup_date = models.DateTimeField(null=True)
    collect_date = models.DateTimeField(null=True)
    male_count = models.IntegerField(default=0, null=True)
    female_count = models.IntegerField(default=0, null=True)
    unknown_count = models.IntegerField(default=0, null=True)
    remarks = models.TextField(default="")
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.DO_NOTHING)
    uuid = models.TextField(unique=True, default=uuid.uuid4)
    source = models.TextField(choices=SOURCE_CHOICES, null=True, default='excel')
    start_location = PointField(srid=4326, null=True, dim=3)
    end_location = PointField(srid=4326, null=True, dim=3)
    start_accuracy = models.DecimalField(null=True, decimal_places=2, max_digits=7)
    end_accuracy = models.DecimalField(null=True, decimal_places=2, max_digits=7)
    api_import = models.ForeignKey(APIImport, null=True, on_delete=CASCADE)
    problem = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "catches"

    def as_location(self):
        latitude = 0
        longitude = 0
        altitude = 0
        if self.end_location:
            latitude = self.start_location.y
            longitude = self.start_location.x
            altitude = self.start_location.z
        return {
        'id': self.id,
        'latitude': latitude,
        'longitude': longitude,
        'altitude': altitude
    }

    def as_dict(self):
        latitude = 0
        longitude = 0
        altitude = 0
        user_name = None
        if self.user:
            user_name = self.user.username
        if self.end_location:
            latitude = self.start_location.y
            longitude = self.start_location.x
            altitude = self.start_location.z
        return {
        'id': self.id,
        'trap': self.trap.id,
        'male_count': self.male_count,
        'female_count': self.female_count,
        'unknown_count': self.unknown_count,
        'source': self.source,
        'longitude': longitude,
        'altitude': altitude,
        'latitude': latitude,
        'username': user_name,
        'remarks': self.remarks,
        'collect_date': self.collect_date,
        'setup_date': self.setup_date,
        'problem': self.problem
    }


class GpsImport(models.Model):
    filename = models.TextField()
    file_date_time = models.DateTimeField(null=True)
    creator = models.TextField(null=True, blank=True)  # This usually holds the model of GPS that created the file.
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=CASCADE, null=True)  # Null only when importing from CLI
    count = models.IntegerField(default=0, null=True, blank=True)

    def __str__(self):
        return "%s - %s " % (self.id, self.filename)

    def as_dict(self):
        username = None
        if self.user:
            username = self.user.username
        return {
            'id': self.id,
            'filename': self.filename,
            'file_date_time': self.file_date_time,
            'creator': self.creator,
            'user': username,
            'created_at': self.created_at,
            'count': self.count
        }


class Target(models.Model):
    name = models.TextField(null=True, blank=True)
    deployment = models.IntegerField(null=True, blank=True)
    full_name = models.TextField(null=True, blank=True)
    gps = models.CharField(max_length=100, blank=True, null=True)
    date_time = models.DateTimeField(null=True)
    river = models.TextField(null=True, blank=True)
    village = models.TextField(null=True, blank=True)
    uuid = models.TextField(null=True, blank=True)
    external_index = models.IntegerField(null=True, blank=True)
    gps_import = models.ForeignKey(GpsImport, null=True, on_delete=CASCADE, blank=True)
    api_import = models.ForeignKey(APIImport, null=True, on_delete=CASCADE, blank=True)
    location = PointField(srid=4326, null=True, dim=3)
    ignore = models.BooleanField(default=False)

    def __str__(self):
        return "%s - %s - %s" % (self.id, self.name, self.date_time)

    def as_location(self):
        return {
            'id': self.id,
            'latitude': self.location.y,
            'longitude': self.location.x
        }

    def as_dict(self):
        username = None
        if self.gps_import:
            username = self.gps_import.user.username
        if self.api_import:
            username = self.api_import.user.username

        return {
            'id': self.id,
            'name': self.name,
            'uuid': self.uuid,
            'latitude': self.location.y,
            'longitude': self.location.x,
            'altitude': self.location.z,
            'deployment': self.deployment,
            'date_time': self.date_time,
            'river': self.river,
            'username': username,
            'ignore': self.ignore,
        }
