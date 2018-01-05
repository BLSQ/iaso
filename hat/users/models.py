from typing import Callable, Any
from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from functools import wraps
from django.utils.translation import ugettext as _


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


class Team(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class Profile(models.Model):
    '''
    User profile.

    :ivar User user:           User reference.
    :ivar text restrict_to_zs: If present give access only to the data
        belonging to the indicated “zone de santé”.
    :ivar Team team:           User team.

    '''

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    restrict_to_zs = models.TextField(
        null=True,
        blank=True,
        help_text=_('When including Yasa Bonga, please also add Yassa Bonga\
         or Yasa-Bonga to take into account spelling differences.')
    )
    team = models.ForeignKey(Team, null=True, blank=True)


@receiver(post_save, sender=User)
@disable_for_loaddata
def create_user_profile(sender, instance, created, **kwargs):  # type: ignore
    if created or not hasattr(instance, 'profile'):
        # Create a profile for new and existing users, that do not have one yet
        Profile.objects.create(user=instance)
    instance.profile.save()
