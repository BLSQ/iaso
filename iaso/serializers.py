from django.contrib.auth.models import User
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from iaso.models import Project


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        """
        Override this method to be able to handle multi-account users.

        If the user is a multi-account user, we return a token for the correct
        "account user" (based on the `app_id` query params) instead of the
        main user that was used for logging in.
        """
        data = super().validate(attrs)

        err_msg = "No active account found with the given credentials"

        if self.user.tenant_users.exists():
            request = self.context.get("request")
            if request:
                app_id = request.query_params.get("app_id", None)
                # For setuper, account name is same as app id for Main Project, so get the first user account with super user status linked to current super user multi account
                if app_id is None:
                    account_tenant_user = self.user.tenant_users.filter(is_superuser=True).first().account_user
                    app_id = account_tenant_user

                try:
                    project = Project.objects.get(app_id=app_id)
                except Project.DoesNotExist:
                    raise AuthenticationFailed(err_msg)

                account_user = User.objects.filter(
                    tenant_user__main_user=self.user,
                    iaso_profile__account=project.account,
                ).first()

                if account_user is None:
                    raise AuthenticationFailed(err_msg)

                refresh = self.get_token(account_user)

                data["refresh"] = str(refresh)
                data["access"] = str(refresh.access_token)

        return data
