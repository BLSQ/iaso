from django.contrib.auth.models import User

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from iaso.models import Project


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        """
        Override this method to be able to take into account the app_id query param.

        If the user is a multi-account user, we return a token for the correct
        "account user" (based on the `app_id`) instead of the main user that was
        used for logging in.
        """
        data = super().validate(attrs)

        if self.user.tenant_users.exists():
            request = self.context.get("request")
            if request:
                app_id = request.query_params.get("app_id", None)
                project = Project.objects.get(app_id=app_id)

                account_user = User.objects.filter(
                    tenant_user__main_user=self.user,
                    iaso_profile__account=project.account,
                ).first()

                refresh = self.get_token(account_user)

                data["refresh"] = str(refresh)
                data["access"] = str(refresh.access_token)

        return data
