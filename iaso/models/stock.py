from django.db import models

from iaso.models import OrgUnit
from iaso.utils.models.soft_deletable import SoftDeletableModel


class Item(SoftDeletableModel):
    name = models.CharField(max_lengt=255)


class Packaging(SoftDeletableModel):
    container = models.ForeignKey(Item)
    item = models.ForeignKey(Item)
    size = models.ForeignKey(Item)


class StockMovement(SoftDeletableModel):
    # type = #draw, add, destruction, loss
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.PROTECT)
    item = models.ForeignKey(Item)
    quantity = models.IntegerField()


class ItemStockStatus(SoftDeletableModel):
    quantity = models.IntegerField()
    item = models.ForeignKey(Item)
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} {self.project}"


class ItemTransfer(SoftDeletableModel):
    quantity = models.IntegerField()
    item = models.ForeignKey(Item)
    # stockTransfer


class StockTransfer(SoftDeletableModel):
    pass
    # source
    # destination
    # transporter
