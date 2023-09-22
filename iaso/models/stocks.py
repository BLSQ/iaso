from django.db import models
from iaso.models import OrgUnit, Account
from rest_framework import serializers


class StockItem(models.Model):
    name = models.CharField(max_length=500)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, blank=True, null=True)

    def __str__(self):
        return self.name


class StockMovement(models.Model):
    stock_item = models.ForeignKey(StockItem, on_delete=models.CASCADE)
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    account = models.ForeignKey(Account, on_delete=models.PROTECT, blank=True, null=True)
    creation_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.stock_item} ({self.quantity}) for {self.org_unit}"

    def save(self, *args, **kwargs):
        if StockMovement.objects.filter(stock_item=self.stock_item, org_unit=self.org_unit).exists():
            current_quantity = StockMovement.objects.filter(
                stock_item=self.stock_item, org_unit=self.org_unit
            ).aggregate(models.Sum("quantity"))["quantity__sum"]

            if current_quantity + self.quantity < 0:
                raise serializers.ValidationError({"quantity": "negative_quantity"})

        if self.quantity == 0:
            raise serializers.ValidationError({"quantity": "zero_quantity"})

        super().save(*args, **kwargs)
