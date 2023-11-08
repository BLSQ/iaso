from rest_framework import serializers

from django.core.exceptions import ObjectDoesNotExist
from django.utils.translation import gettext_lazy as _


class IdOrUuidRelatedField(serializers.PrimaryKeyRelatedField):
    """
    Represent the target of the relationship using its `id` or `uuid`.
    """

    default_error_messages = {
        "required": _("This field is required."),
        "does_not_exist": _('Invalid pk or uuid "{pk_value}" - object does not exist.'),
        "incorrect_type": _("Incorrect type. Expected pk or uuid value, received {data_type}."),
    }

    def to_internal_value(self, data):
        try:
            kwargs = {"pk": data} if isinstance(data, int) else {"uuid": data}
            return self.get_queryset().get(**kwargs)
        except ObjectDoesNotExist:
            self.fail("does_not_exist", pk_value=data)
        except (TypeError, ValueError):
            self.fail("incorrect_type", data_type=type(data).__name__)
