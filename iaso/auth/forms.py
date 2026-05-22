from axes.handlers.proxy import AxesProxyHandler
from django.contrib.auth.forms import AuthenticationForm
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class AxesAuthenticationForm(AuthenticationForm):
    """Custom form to show a lockout message when the user login is rate limited."""

    def clean(self):
        username = self.cleaned_data.get("username")
        if username:
            credentials = {"username": username}
            # When the user is already locked
            if AxesProxyHandler.is_locked(self.request, credentials):
                # We set this to False so that AxesMiddleware does not intercept the response
                # and allows us to show the error message in the form.
                self.request.axes_locked_out = False
                raise ValidationError(
                    _("Too many login attempts. Please try again later."),
                    code="too_many_attempts",
                )

        try:
            return super().clean()
        # When the locking is triggered by this submission
        except ValidationError:
            # django-axe flagging the request propagates as a ValidationError
            # that we have to catch here to show our custom error message.
            if getattr(self.request, "axes_locked_out", False):
                self.request.axes_locked_out = False
                raise ValidationError(
                    _("Too many login attempts. Please try again later."),
                    code="too_many_attempts",
                )
            raise
