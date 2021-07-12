from django.utils.translation import gettext as _


class InvalidFormatError(Exception):
    pass


class TemplateNotFound(Exception):

    def __str__(self):
        return _("Preparedness template not configured")
