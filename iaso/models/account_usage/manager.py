from django.db import models


class ProxyAccountUsageManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(metric=self.model.metric_type)
