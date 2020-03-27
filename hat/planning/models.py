from django.db import models
from ..geo.models import Village, AS
from ..users.models import Coordination, Team
from django.db.models import Sum
import random
from hat.users.middleware import get_current_user
from hat.users.models import get_user_geo_list


class Planning(models.Model):
    year = models.PositiveIntegerField()
    name = models.CharField(max_length=255)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted = models.BooleanField(default=False)
    is_template = models.BooleanField(default=False)

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

    def copy(self, new_name):
        planning = self
        original_planning_id = planning.id

        planning.name = new_name
        planning.id = None
        planning.save()

        assignations = Assignation.objects.filter(planning_id=original_planning_id)

        for assignation in assignations:
            assignation.pk = None
            assignation.planning_id = planning.id
            assignation.save()

        team_action_zones = TeamActionZone.objects.filter(planning_id=original_planning_id)

        for taz in team_action_zones:
            taz.pk = None
            taz.planning_id = planning.id
            taz.save()

        workzones = WorkZone.objects.filter(planning_id=original_planning_id)

        for workzone in workzones:
            as_list = list(workzone.AS.all())
            team_list = list(workzone.teams.all())

            workzone.pk = None
            workzone.planning_id = planning.id
            workzone.save()

            workzone.AS.clear()
            workzone.AS.set(as_list)

            workzone.teams.clear()
            workzone.teams.set(team_list)

        return planning


class Assignation(models.Model):
    planning = models.ForeignKey(Planning, on_delete=models.CASCADE)
    village = models.ForeignKey(Village, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    month = models.IntegerField(null=True, blank=True)
    index = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    population_splitted = models.PositiveIntegerField(null=True)

    def __str__(self):
        return "%s - % s - %s" % (self.planning, self.village, self.team)

    class Meta:
        unique_together = (('planning', 'village', 'month'),)

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
            'index': self.index,
            'splitted': self.population_splitted is not None,
            'population_splitted': self.population_splitted
        }


def pick_random_color():
     return random.choice([
    '#FF6900',
    '#FCB900',
    '#7BDCB5',
    '#22955A',
    '#8ED1FC',
    '#0693E3',
    '#00008B',
    '#bf4840',
    '#F78DA7',
    '#9900EF',])


class WorkZone(models.Model):
    name = models.TextField()
    color = models.TextField(default=pick_random_color)
    planning = models.ForeignKey(Planning, on_delete=models.CASCADE)
    coordination = models.ForeignKey(Coordination, on_delete=models.CASCADE)
    teams = models.ManyToManyField(Team)
    AS = models.ManyToManyField(AS, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def as_dict(self, with_areas=True, additional_fields=None):
        total_capacity = 0
        for team in self.teams.all():
            total_capacity += team.capacity

        teams_list = [team.as_dict_without_as() for team in self.teams.all()]

        if hasattr(self, "population_sum"):
            total_population = getattr(self, "population_sum")
        else:
            total_population = Village.objects.filter(AS__in=self.AS.all()).aggregate(Sum('population'))['population__sum']
        if total_population is None:
            total_population = 0  # to always output a number, and not null

        res = {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'teams': teams_list,
            'total_capacity': total_capacity,
            'total_population': total_population,
            'planning_id': self.planning_id,
            'coordination_id': self.coordination_id,
            'planning_name': self.planning.name,
            'coordination_name': self.coordination.name
        }

        if with_areas:
            user = get_current_user()
            areas = self.AS.all()
            if not user.profile.province_scope.count() == 0:
                areas = areas.filter(ZS__province_id__in=get_user_geo_list(user, 'province_scope'))
            if not user.profile.ZS_scope.count() == 0:
                areas = areas.filter(ZS__id__in=get_user_geo_list(user, 'ZS_scope'))
            if not user.profile.AS_scope.count() == 0:
                areas = areas.filter(id__in=get_user_geo_list(user, 'AS_scope'))

            as_list = [area.as_dict() for area in areas]
            res['as_list'] = as_list

        # include fields that were added through annotate
        if additional_fields:
            for field in additional_fields:
                if hasattr(self, field):
                    res[field] = getattr(self, field)

        return res

    def __str__(self):
        return "%s - % s - %s" % (self.name, self.coordination, self.planning)


class TeamActionZone(models.Model):
    team = models.ForeignKey(Team, null=False, blank=False, on_delete=models.CASCADE)
    planning = models.ForeignKey(Planning, null=False, blank=False, on_delete=models.CASCADE)
    area = models.ForeignKey(AS, null=False, blank=False, on_delete=models.CASCADE)

    def __str__(self):
        return "%s - %s - %s" % (self.team, self.planning, self.area)