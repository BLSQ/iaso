
from typing import Callable, Any
from django.contrib.auth.models import User
from django.contrib.postgres.fields import CITextField, ArrayField
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from functools import wraps
from hat.geo.models import AS, ZS, Province
from hat.users.middleware import get_current_user
from django.db.models import TextField


from django.contrib.auth.models import Permission

SCREENER = 'screener'
CONFIRMER = 'confirmer'

TESTER_TYPE_CHOICES = (
    (SCREENER, 'Dépisteur'),
    (CONFIRMER, 'Confirmateur'),
)

def get_user_geo_list(user, key):
    return getattr(user.profile, key).values_list('pk', flat=True)


def is_authorized_user(user, province_id, zone_id, area_id):
    user_as_ids = get_user_geo_list(user, 'AS_scope')
    user_zs_ids = get_user_geo_list(user, 'ZS_scope')
    user_province_ids = get_user_geo_list(user, 'province_scope')
    is_authorized = len(user_as_ids) == 0 and \
        len(user_zs_ids) == 0 and \
        len(user_province_ids) == 0
    if not is_authorized:
        if (province_id in user_province_ids) and len(user_zs_ids) == 0 and len(user_as_ids) == 0:
            is_authorized = True
        if (zone_id in user_zs_ids) and len(user_as_ids) == 0:
            is_authorized = True
        if area_id in user_as_ids:
            is_authorized = True
    return is_authorized


def disable_for_loaddata(signal_handler: Callable) -> Callable:
    # Disable signal handler when model is created by `manage loaddata`.
    # When loading fixtures, all models are already defined in the
    # fixtures file and we do not want the signal handler to create
    # another model, which would raise an IntegrityError.

    @wraps(signal_handler)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        if kwargs.get('raw', False):
            return
        signal_handler(*args, **kwargs)
    return wrapper


class Coordination(models.Model):
    name = models.CharField(max_length=255)
    ZS = models.ManyToManyField(ZS)

    created_at = models.DateTimeField(auto_now_add=True)

    def as_dict(self):
        zs_query = self.ZS.order_by("name")
        user = get_current_user()
        if user.profile.province_scope.count() != 0:
            zs_query = zs_query.filter(province__id__in=user.profile.province_scope.all().values_list('pk', flat=True))\
                .distinct()
        if user.profile.ZS_scope.count() != 0:
            zs_query = zs_query.filter(id__in=user.profile.ZS_scope.all().values_list('pk', flat=True)).distinct()
        return {
            'name': self.name,
            'teams': map(lambda x: x.as_dict(),  self.team_set.order_by("name")),
            'zs': map(lambda x: x.as_dict(), zs_query),
            'id': self.id,
            'created_at': self.created_at
        }

    def __str__(self):
        return self.name


class Team(models.Model):
    name = models.CharField(max_length=255)
    coordination = models.ForeignKey(Coordination, null=True, on_delete=models.CASCADE)
    capacity = models.IntegerField()
    UM = models.BooleanField(default=True)
    aliases = ArrayField(
        CITextField(max_length=255, blank=True),
        size=20,
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def as_dict(self, planning_id=None):
        res = {
            'name': self.name,
            'id': self.id,
            'capacity': self.capacity
        }
        if planning_id is not None:
            from hat.planning.models import TeamActionZone
            res['AS'] = [taz.area.as_dict() for taz in TeamActionZone.objects.filter(planning_id=planning_id, team_id=self.id).select_related("area")]
        return res

    def as_dict_without_as(self):
        return {
            'name': self.name,
            'id': self.id,
            'capacity': self.capacity
        }

    def get_as(self, planning_id):
        from hat.planning.models import TeamActionZone
        areas = [taz.area for taz in TeamActionZone.objects.filter(planning_id=planning_id, team_id=self.id).select_related("area")]
        if not areas:
            return AS.objects.filter(ZS__in=self.coordination.ZS.all())
        else:
            return areas

    def __str__(self):
        type = "MUM"
        if self.UM:
            type = "UM"
        return "%s - %s - %s - %s" % (self.name, self.capacity, type, self.coordination.name)


class Institution(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class UserType(models.Model):
    name = models.CharField(max_length=255)
    permissions = models.ManyToManyField(Permission)

    def __str__(self):
        return self.name

    def as_dict(self):
        return {
            'name': self.name,
            'id': self.id,
            'permissions': map(lambda a: a.id, self.permissions.all()),
        }


class Profile(models.Model):
    """
    User profile.

    :ivar User user:           User reference.
    :ivar Team team:           User team.
    :ivar Institution institution:           User institution.
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # permissions will be handled by Django standard mechanisms based on the user permissions
    team = models.ForeignKey(Team, null=True, blank=True, on_delete=models.SET_NULL)
    institution = models.ForeignKey(Institution, null=True, blank=True, on_delete=models.SET_NULL)
    userType = models.ForeignKey(UserType, null=True, blank=True, on_delete=models.SET_NULL)

    province_scope = models.ManyToManyField(Province, blank=True)
    ZS_scope = models.ManyToManyField(ZS, blank=True)
    AS_scope = models.ManyToManyField(AS, blank=True)

    password_reset = models.BooleanField(default=False)

    phone = models.TextField(null=True, blank=True)

    tester_type = models.TextField("Type de tester", choices=TESTER_TYPE_CHOICES, null=True, blank=True)

    def full_name(self):
        name = ""
        if self.user:
            if self.user.first_name:
                name = self.user.first_name

            if self.user.last_name:
                name = "%s %s" % (name, self.user.last_name)

            name = "%s (%s)" % (name, self.user.username)

        return name.strip()

    def as_dict(self):
        institution = None
        if self.institution:
            institution = {
                'name': self.institution.name,
                'id': self.institution.id
            }
        userType = None
        if self.userType:
            userType = self.userType.as_dict()
        team = None
        if self.team:
            team = self.team.id
        return {
            "id": self.id,
            "firstName": self.user.first_name,
            "userName": self.user.username,
            "lastName": self.user.last_name,
            "email": self.user.email,
            "phone": self.phone,
            "team": team,
            "permissions": list(self.user.user_permissions.filter(codename__startswith="x_").values_list('id', flat=True)),
            "institution": institution,
            "userType": userType,
            "AS": self.AS_scope.all().values_list('id', flat=True),
            "ZS": self.ZS_scope.all().values_list('id', flat=True),
            "province": self.province_scope.all().values_list('id', flat=True),
            "passwordReset": self.password_reset,
            "tester_type": self.tester_type,
            "is_superuser": self.user.is_superuser,
    }

    def __str__(self):
        return "%s - %s" % (self.user, self.institution)


@receiver(post_save, sender=User)
@disable_for_loaddata
def create_user_profile(sender, instance, created, **kwargs):  # type: ignore
    if created or not hasattr(instance, 'profile'):
        # Create a profile for new and existing users, that do not have one yet
        Profile.objects.create(user=instance)
    instance.profile.save()
