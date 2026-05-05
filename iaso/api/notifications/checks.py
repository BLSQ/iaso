from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone

from hat.api_import.models import APIImport
from iaso.models import Project


DAYS_TO_CHECK = 30


def check_apiimport_for_user(user: User) -> int:
    account = user.iaso_profile.account if not user.is_staff else None
    queryset = APIImport.objects.filter(has_problem=True).filter(
        created_at__gte=timezone.now() - timedelta(days=DAYS_TO_CHECK)
    )
    if account:
        queryset = queryset.filter(
            app_id__in=Project.objects.filter(account=account).only("app_id").values_list("app_id")
        )
    return queryset.count()
