
from typing import Callable, Any
from django.contrib.auth.models import User
from django.contrib.postgres.fields import CITextField, ArrayField
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from functools import wraps
from hat.geo.models import AS, ZS, Province


def disable_for_loaddata(signal_handler: Callable) -> Callable:
    # Disable signalhandler when model is created by `manage loaddata`.
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
        return {
            'name': self.name,
            'teams': map(lambda x: x.as_dict(),  self.team_set.order_by("name")),
            'zs': map(lambda x: x.as_dict(),  self.ZS.order_by("name")),
            'id': self.id,
            'created_at': self.created_at
        }

    def __str__(self):
        return self.name


class Team(models.Model):
    name = models.CharField(max_length=255)
    coordination = models.ForeignKey(Coordination, null=True, on_delete=models.CASCADE)
    AS = models.ManyToManyField(AS, blank=True)
    capacity = models.IntegerField()
    UM = models.BooleanField(default=True)
    aliases = ArrayField(
        CITextField(max_length=255, blank=True),
        size=20,
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def as_dict(self):
        return {
            'name': self.name,
            'id': self.id,
            'AS': map(lambda a: a.as_dict(), self.get_as()),
            'capacity': self.capacity
        }

    def as_dict_without_as(self):
        return {
            'name': self.name,
            'id': self.id,
            'capacity': self.capacity
        }

    def get_as(self):
        if not self.AS.all():
            return AS.objects.filter(ZS__in=self.coordination.ZS.all())
        else:
            return self.AS.all()

    def __str__(self):
        type = "MUM"
        if self.UM:
            type = "UM"
        return "%s - %s - %s - %s" % (self.name, self.capacity, type, self.coordination.name)


class Institution(models.Model):
    name = models.CharField(max_length=255)


class Profile(models.Model):
    '''
    User profile.

    :ivar User user:           User reference.
    :ivar Team team:           User team.
    :ivar Institution institution:           User insitution.
    '''

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # permissions will be handled by Django standard mechanisms based on the user permissions
    team = models.ForeignKey(Team, null=True, blank=True, on_delete=models.SET_NULL)
    institution = models.ForeignKey(Institution, null=True, blank=True, on_delete=models.SET_NULL)

    province_scope = models.ManyToManyField(Province)
    ZS_scope = models.ManyToManyField(ZS)
    AS_scope = models.ManyToManyField(AS)

    phone = models.TextField(null=True, blank=True)

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
                self.institution.name,
                self.institution.id
            }
        return {
            "id": self.id,
            "firstName": self.user.first_name,
            "lastName": self.user.last_name,
            "email": self.user.email,
            "permissions": list(self.user.user_permissions.values_list('codename', flat=True)),
            "institution": institution,
            "AS": list(self.AS_scope.all().values_list('id')),
            "ZS": list(self.ZS_scope.all().values_list('id')),
            "province": list(self.province_scope.all().values_list('id'))
    }

@receiver(post_save, sender=User)
@disable_for_loaddata
def create_user_profile(sender, instance, created, **kwargs):  # type: ignore
    if created or not hasattr(instance, 'profile'):
        # Create a profile for new and existing users, that do not have one yet
        Profile.objects.create(user=instance)
    instance.profile.save()
