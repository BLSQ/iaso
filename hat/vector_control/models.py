from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField, CITextField
from django.contrib.gis.db.models.fields import PointField
from django.db import models
from django.db.models import Count
import uuid
import json
from django.contrib.postgres.fields import JSONField

# Create your models here.
#Site	Zone	Zone.Abb	LAT	LONG	Habitat	FirstSurvey	FirstSurveyDate	Count	Total	Operation	DATE_.SETUP	DATE_.COLLECT	In_Out	Males	Females	Unknown	Remarks	distToTargets	NearIntervention	elevChange	trapElev	targetElev	elevDiff

#Site	Zone	Zone.Abb	LAT	LONG	Habitat	FirstSurvey	FirstSurveyDate	Count	Total
#Site	Operation	DATE_.SETUP	DATE_.COLLECT	In_Out	Males	Females	Unknown	Remarks	distToTargets	NearIntervention	elevChange	trapElev	targetElev	elevDiff
from django.db.models import CASCADE

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
    ("site", "Site"),
    ("catch", "Catch")
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
            'user': self.user,
            'created_at': self.created_at,
            'type': self.import_type
        }

        if self.import_type == 'site' :
            site_count = self.site_set.count()
            res['site_count'] = site_count

        elif self.import_type == 'catch' > 0:
            catch_count = self.catch_set.count()
            res['catch_count'] = catch_count


class Site(models.Model):
    name = models.CharField(max_length=50, null=True)
    altitude = models.DecimalField(null=True, decimal_places=2, max_digits=7)
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
    location = PointField(srid=4326, null=True)
    ignore = models.BooleanField(default=False)
    api_import = models.ForeignKey(APIImport, null=True, on_delete=CASCADE)

    def __str__(self):
        return "%s - %s - %s" % (self.id, self.habitat, self.location)

    def as_location(self):
        geojson =  self.location.json
        coordinates = json.loads(geojson).get('coordinates')

        return {
        'id': self.id,
        'latitude': coordinates[1],
        'longitude': coordinates[0]
    }

    def as_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'habitat': self.habitat,
            'created_at': self.created_at,
            'username': self.user.username,
            'is_reference': self.is_reference,
            'ignore': self.ignore,
            'latitude': self.location.y,
            'longitude': self.location.x,
            'altitude': self.altitude,
            'description': self.description,
        }


class Catch(models.Model):
    site = models.ForeignKey(Site, on_delete=models.CASCADE)
    setup_date = models.DateTimeField(null=True)
    collect_date = models.DateTimeField(null=True)
    male_count = models.IntegerField(default=0, null=True)
    female_count = models.IntegerField(default=0, null=True)
    unknown_count = models.IntegerField(default=0, null=True)
    remarks = models.TextField(default="")
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.DO_NOTHING)
    uuid = models.TextField(unique=True, default=uuid.uuid4)
    source = models.TextField(choices=SOURCE_CHOICES, null=True, default='excel')
    start_location = PointField(srid=4326, null=True)
    end_location = PointField(srid=4326, null=True)
    start_altitude = models.DecimalField(null=True, decimal_places=2, max_digits=7)
    start_accuracy = models.DecimalField(null=True, decimal_places=2, max_digits=7)
    end_altitude = models.DecimalField(null=True, decimal_places=2, max_digits=7)
    end_accuracy = models.DecimalField(null=True, decimal_places=2, max_digits=7)
    api_import = models.ForeignKey(APIImport, null=True, on_delete=CASCADE)

    def as_location(self):
        return {
        'id': self.id,
        'latitude': self.end_location.y,
        'longitude': self.end_location.x
    }

    def as_dict(self):
        return {
        'id': self.id,
        'site': self.site.id,
        'male_count': self.male_count,
        'female_count': self.female_count,
        'unknown_count': self.unknown_count,
        'source': self.source
    }


class GpsImport(models.Model):
    filename = models.TextField()
    file_date_time = models.DateTimeField(null=True)
    creator = models.TextField(null=True, blank=True)  # This usually holds the model of GPS that created the file.
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=CASCADE, null=True)  # Null only when importing from CLI

    def __str__(self):
        return "%s - %s " % (self.id, self.filename)

    def as_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'file_date_time': self.file_date_time,
            'creator': self.creator,
            'user': self.user.username,
            'created_at': self.created_at
        }


class Target(models.Model):
    name = models.TextField(null=True)
    deployment = models.IntegerField(null=True)
    full_name = models.TextField(null=True)
    gps = models.CharField(max_length=100)
    altitude = models.DecimalField(null=True, decimal_places=2, max_digits=7)
    date_time = models.DateTimeField(null=True)
    river = models.TextField(null=True)
    gps_import = models.ForeignKey(GpsImport, null=True, on_delete=CASCADE)
    location = PointField(srid=4326, null=True)
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
        return {
            'id': self.id,
            'name': self.name,
            'latitude': self.location.y,
            'longitude': self.location.x,
            'deployment': self.deployment,
            'altitude': self.altitude,
            'date_time': self.date_time,
            'river': self.river,
            'username': self.gps_import.user.username,
            'ignore': self.ignore,
        }
