from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from functools import wraps


def disable_for_loaddata(signal_handler):
    '''
    Disable signalhandler when model is created by `manage loaddata`.
    When loading fixtures, all models are already defined in the
    fixtures file and we do not want the signal handler to create
    another model, which would raise an IntegrityError.
    '''
    @wraps(signal_handler)
    def wrapper(*args, **kwargs):
        if kwargs.get('raw', False):
            return
        signal_handler(*args, **kwargs)
    return wrapper


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    restrict_to_zs = models.TextField(null=True)


@receiver(post_save, sender=User)
@disable_for_loaddata
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
@disable_for_loaddata
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
