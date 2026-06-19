from datetime import datetime

from django.db import transaction
from django.utils import timezone

from iaso.models.account_usage import PeriodTypeChoices


class AccountUsageService:
    @staticmethod
    def get_period_start(period_type, now=None):
        now = now or timezone.now()
        if period_type == PeriodTypeChoices.DAY:
            return datetime(now.year, now.month, now.day, tzinfo=now.tzinfo)
        if period_type == PeriodTypeChoices.WEEK:
            return datetime(now.year, now.month, now.day - now.weekday())
        if period_type == PeriodTypeChoices.MONTH:
            return datetime(now.year, now.month, 1, tzinfo=now.tzinfo)
        if period_type == PeriodTypeChoices.YEAR:
            return datetime(now.year, 1, 1, tzinfo=now.tzinfo)

    @staticmethod
    def get_period_type(model_cls):
        return model_cls.default_period_type

    @staticmethod
    @transaction.atomic
    def increment(model_cls, account, amount=1, period_type=None, initial_queryset=None, now=None):
        if not period_type:
            period_type = AccountUsageService.get_period_type(model_cls)

        if period_type == PeriodTypeChoices.ALL_TIME:
            obj = model_cls.objects.filter(account=account).first()
            if not obj:
                model_cls.objects.create(
                    account=account,
                    usage=initial_queryset.count() if initial_queryset else 0,
                )
            else:
                obj = model_cls.objects.select_for_update().get(account=account)
                obj.usage += amount
                obj.save()
        else:
            period_start_at = AccountUsageService.get_period_start(period_type, now)
            obj = model_cls.objects.filter(account=account, period_starts_at=period_start_at).first()
            if not obj:
                model_cls.objects.create(
                    account=account,
                    usage=initial_queryset.filter(
                        created_at__gte=period_start_at, created_at__lt=model_cls.get_period_ends_at(period_start_at)
                    ).count(),
                    period_starts_at=period_start_at,
                )
            else:
                obj = model_cls.objects.select_for_update().get(account=account, period_starts_at=period_start_at)
                obj.usage += amount
                obj.save()
