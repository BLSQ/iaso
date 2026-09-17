from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.urls import NoReverseMatch, reverse


UserModel = get_user_model()


def _is_token_obtain_request(request) -> bool:
    """True when this authenticate() call is for JWT token issuance.

    `token_obtain_pair` is not registered when DISABLE_PASSWORD_LOGINS is on.
    """
    if not request or not hasattr(request, "path"):
        return False
    try:
        return request.path == reverse("token_obtain_pair")
    except NoReverseMatch:
        return False


class MultiTenantAuthBackend(ModelBackend):
    """
    Authenticates a user with multiple accounts and activate the most recently used account.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        user = super().authenticate(request, username=username, password=password, **kwargs)

        if user:
            # Skip tenant switching for token generation requests.
            if _is_token_obtain_request(request):
                return user

            # When users switch accounts, `login()` is called and automatically updates `last_login`.
            tenant_user = UserModel.objects.filter(tenant_user__main_user=user).order_by("-last_login").first()
            if tenant_user:
                if not hasattr(tenant_user, "iaso_profile"):
                    raise ValueError(f"Tenant user `{tenant_user.username}` is missing a `iaso_profile`.")
                return tenant_user

            return user
