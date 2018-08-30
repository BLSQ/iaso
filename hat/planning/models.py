from django.db import models
from ..geo.models import Village, AS
from ..users.models import Team, Coordination
from django.db.models import Sum


class Planning(models.Model):
    year = models.PositiveIntegerField()
    name = models.CharField(max_length=255)
    updated_at = models.DateTimeField(auto_now=True)
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

    class Meta:
        unique_together = (('planning', 'village'),)

    def as_dict(self):
        return {
            'village_id': self.village_id,
            'village_name': self.village.name,
            'village_population': self.village.population,
            'longitude': self.village.longitude,
            'latitude': self.village.latitude,
            'team_id': self.team_id,
            'id': self.id,
            'month': self.month,
            'index': self.index
        }


class WorkZone(models.Model):
    name = models.TextField()
    planning = models.ForeignKey(Planning, on_delete=models.CASCADE)
    coordination = models.ForeignKey(Coordination, on_delete=models.CASCADE)
    teams = models.ManyToManyField(Team)
    AS = models.ManyToManyField(AS, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def as_dict(self):
        total_capacity = 0
        for team in self.teams.all():
            total_capacity += team.capacity

        teams_list = [team.as_dict_without_as() for team in self.teams.all()]
        as_list = [area.as_dict() for area in self.AS.all()]
        total_population = Village.objects.filter(AS__in=self.AS.all()).aggregate(Sum('population'))['population__sum']
        if total_population is None:
            total_population = 0  # to always output a number, and not null

        res = {
            'id': self.id,
            'name': self.name,
            'teams': teams_list,
            'as_list': as_list,
            'total_capacity': total_capacity,
            'total_population': total_population,
            'planning_id': self.planning_id,
            'coordination_id': self.coordination_id,
            'planning_name': self.planning.name,
            'coordination_name': self.coordination.name
        }

        if hasattr(self, 'population_endemic_villages'):
            res['population_endemic_villages'] = self.population_endemic_villages

        return res

    def __str__(self):
        return "%s - % s - %s" % (self.name, self.coordination, self.planning)

