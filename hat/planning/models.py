from django.db import models
from ..geo.models import Village
from ..users.models import Team


class Planning(models.Model):
    year = models.PositiveIntegerField()
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "%s - % s" % (self.year, self.name)


class Assignation(models.Model):
    planning = models.ForeignKey(Planning)
    village = models.ForeignKey(Village)
    team = models.ForeignKey(Team)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "%s - % s - %s" % (self.planning, self.village, self.team)

