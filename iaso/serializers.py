from django.contrib.auth.models import User
from rest_framework.exceptions import NotFound, PermissionDenied
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

        request = self.context.get("request")
        app_id = request.query_params.get("app_id")

        if app_id:
            try:
                project = Project.objects.get(app_id=app_id)
            except Project.DoesNotExist:
                raise NotFound("Unknown project.")  # 404

            # Handle multi-account users.
            account_user = None
            if self.user.tenant_users.exists():
                account_user = User.objects.filter(
                    tenant_user__main_user=self.user,
                    iaso_profile__account=project.account,
                ).first()

                if not account_user:
                    raise AuthenticationFailed("No active account found with the given credentials.")  # 401

                refresh = self.get_token(account_user)

                data["refresh"] = str(refresh)
                data["access"] = str(refresh.access_token)

            # Handle project restrictions.
            user = account_user or self.user
            restricted_projects_ids = user.iaso_profile.projects_ids
            if restricted_projects_ids and project.id not in restricted_projects_ids:
                raise PermissionDenied("You don't have access to this project.")  # 403

        return data
