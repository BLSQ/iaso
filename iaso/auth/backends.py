from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.urls import reverse


UserModel = get_user_model()


class MultiTenantAuthBackend(ModelBackend):
    """
    Authenticates a user with multiple accounts and activate the most recently used account.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        user = super().authenticate(request, username=username, password=password, **kwargs)

        if user:
            # Skip tenant switching for token generation requests.
            if request and hasattr(request, "path") and request.path == reverse("token_obtain_pair"):
                return user

            # When users switch accounts, `login()` is called and automatically updates `last_login`.
            tenant_user = UserModel.objects.filter(tenant_user__main_user=user).order_by("-last_login").first()
            if tenant_user:
                return tenant_user

            return user
