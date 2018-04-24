from django.db import models
from ..geo.models import Village
from ..users.models import Team


class Planning(models.Model):
    year = models.PositiveIntegerField()
    name = models.CharField(max_length=255)
    updated_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted = models.BooleanField(default=False)

    def __str__(self):
        return "%s - % s" % (self.year, self.name)

    def as_dict(self):
        assignations = {}
        for assignation in self.assignation_set.all():
            assignations[assignation.village_id] = assignation.as_dict()

        return {
            'id': self.id,
            'year': self.year,
            'name': self.name,
            'assignations': assignations
        }


class Assignation(models.Model):
    planning = models.ForeignKey(Planning, on_delete=models.CASCADE)
    village = models.ForeignKey(Village, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    month = models.IntegerField(null=True, blank=True)
    index = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "%s - % s - %s" % (self.planning, self.village, self.team)

    class Meta():
        unique_together = (('planning', 'village'),)

    def as_dict(self):
        return {
            'village_id': self.village_id,
           # 'village_name': self.village.name,
           # 'longitude': self.village.longitude,
           # 'latitude': self.village.latitude,
            'team_id': self.team_id,
            'id': self.id,
            'month': self.month,
            'index': self.index,
           # 'AS_name': self.village.AS.name,
           # 'population': self.village.population
        }