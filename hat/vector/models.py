from django.db import models

# Create your models here.
#Site	Zone	Zone.Abb	LAT	LONG	Habitat	FirstSurvey	FirstSurveyDate	Count	Total	Operation	DATE_.SETUP	DATE_.COLLECT	In_Out	Males	Females	Unknown	Remarks	distToTargets	NearIntervention	elevChange	trapElev	targetElev	elevDiff

#Site	Zone	Zone.Abb	LAT	LONG	Habitat	FirstSurvey	FirstSurveyDate	Count	Total
#Site	Operation	DATE_.SETUP	DATE_.COLLECT	In_Out	Males	Females	Unknown	Remarks	distToTargets	NearIntervention	elevChange	trapElev	targetElev	elevDiff


class Site(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    zone = models.TextField(null=True)
    latitude = models.DecimalField(null=True, decimal_places=6, max_digits=10)
    longitude = models.DecimalField(null=True, decimal_places=6, max_digits=10)
    habitat = models.CharField(max_length=255, null=True)
    first_survey = models.CharField(max_length=255, null=True)
    first_survey_date = models.DateTimeField(null=True)
    count = models.IntegerField()
    total = models.IntegerField()

    def __str__(self):
        return "%s - %s - %s" % (self.id, self.zone, self.habitat)

    def as_dict(self):
        return {
            'id': self.id,
            'zone': self.zone,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'habitat': self.habitat,
            'first_survey': self.first_survey,
            'first_survey_date': self.first_survey_date,
            'count': self.count,
            'total': self.total
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

    def __str__(self):
        return "%s - %s - %s" % (self.site, self.operation, self.collect_date)

#ID	NAME	Deployment	FullName	GPS	Lat	Long	Altitude	DateTimeS	Date	River


class Target(models.Model):
    id = models.CharField(max_length=128, primary_key=True)
    name = models.TextField(null=True)
    deployment = models.IntegerField(null=True)
    full_name = models.TextField(null=True)
    gps = models.CharField(max_length=100)
    latitude = models.DecimalField(null=True, decimal_places=6, max_digits=10)
    longitude = models.DecimalField(null=True, decimal_places=6, max_digits=10)
    altitude = models.DecimalField(null=True, decimal_places=2, max_digits=7)
    date_time = models.DateTimeField(null=True)
    river = models.TextField(null=True)

    def __str__(self):
        return "%s - %s - %s" % (self.site, self.operation, self.collect_date)

    def as_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'deployment': self.deployment,
            'altitude': self.altitude,
            'date_time': self.date_time,
            'river': self.river
        }



