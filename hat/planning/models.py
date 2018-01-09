from django.db import models
from ..geo.models import Village
from ..users.models import Team


class Planning(models.Model):
    year = models.PositiveIntegerField()
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "%s - % s" % (self.year, self.name)

    def as_dict(self):
        assignations = []
        for assignation in self.assignation_set.all():
            assignations.append(assignation.as_dict())

        return {
            'id': self.id,
            'year': self.year,
            'name': self.name,
            'assignations': assignations
        }


class Assignation(models.Model):
    planning = models.ForeignKey(Planning)
    village = models.ForeignKey(Village)
    team = models.ForeignKey(Team)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "%s - % s - %s" % (self.planning, self.village, self.team)

    class Meta():
        unique_together = (('planning', 'village', 'team'),)

    def as_dict(self):
        return {
            'village': self.village_id,
            'team': self.team_id,
        }