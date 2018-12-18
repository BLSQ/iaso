from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField, CITextField
from django.contrib.gis.db.models.fields import PointField
from django.db import models
from django.db.models import Count
import uuid
import json

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

    def __str__(self):
        return "%s - %s - %s" % (self.id, self.habitat)

    def as_location(self):
        geojson =  self.location.json
        coordinates = json.loads(geojson).get('coordinates')

        return {
        'id': self.id,
        'latitude': coordinates[1],
        'longitude': coordinates[0]
    }

    def as_dict(self):
        first_catch_date = None
        catches_count = self.catch_set.count()
        if catches_count > 0:
            first_catch_date = self.catch_set.order_by('setup_date').first().setup_date
        return {
            'id': self.id,
            'name': self.name,
            'habitat': self.habitat,
            'created_at': self.created_at,
            'username': self.user.username,
            'is_reference': self.is_reference,
            'ignore': self.ignore,
            'latitude': self.location.y,
            'longitude': self.location.x,
        }


class Catch(models.Model):
    site = models.ForeignKey(Site, on_delete=models.CASCADE)
    operation = models.TextField(null=True)
    setup_date = models.DateTimeField(null=True)
    collect_date = models.DateTimeField(null=True)
    in_out = models.TextField(null=True)
    male_count = models.IntegerField(default=0, null=True)
    female_count = models.IntegerField(default=0, null=True)
    unknown_count = models.IntegerField(default=0, null=True)
    remarks = models.TextField(default="")
    distance_to_targets = models.DecimalField(null=True, decimal_places=3, max_digits=10)
    near_intervention = models.CharField(max_length=100)
    elev_change = models.IntegerField(null=True)
    trap_elev = models.IntegerField(null=True)
    target_elev = models.IntegerField(null=True)
    elev_diff = models.IntegerField(null=True)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.DO_NOTHING)
    uuid = models.TextField(unique=True, default=uuid.uuid4)
    source = models.TextField(choices=SOURCE_CHOICES, null=True, default='excel')
    location = PointField(srid=4326, null=True)

    def __str__(self):
        return "%s - %s - %s" % (self.site, self.operation, self.collect_date)

    def as_location(self):
        return {
        'id': self.id,
        'latitude': self.location.y,
        'longitude': self.location.x
    }
    def as_dict(self):
        return {
        'id': self.id,
        'site': self.site.id,
        'male_count': self.male_count,
        'female_count': self.female_count,
        'unknown_count': self.unknown_count,
        'source': self.source,
        'near_intervention': self.near_intervention,
        'latitude': self.location.y,
        'longitude': self.location.x
    }

#ID	NAME	Deployment	FullName	GPS	Lat	Long	Altitude	DateTimeS	Date	River
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
            'created_at': self.created_at,
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
