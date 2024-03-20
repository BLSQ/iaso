from rest_framework import viewsets, permissions, status as http_status
from rest_framework.response import Response

from iaso.api.common import HasPermission
from hat.menupermissions import models as permission
from iaso.api.tasks import TaskSerializer
from iaso.models.payments import PaymentLot
from iaso.tasks.payments_bulk_update import payments_bulk_update


class PaymentsBulkUpdate(viewsets.ViewSet):
    """Bulk update Payments

    Although only the Payment's status is updated, we opted for a Task, i.o. using Django's update, because we need
    to reliably log the changes with a Modification, so it seemed safer to loop through the actual objects and log the changes
    as they happen, instead of using update() or bulk_update() to modify the DB and log the changes separately.
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.PAYMENTS)]

    def create(self, request):
        select_all = request.data.get("select_all", False)
        status = request.data.get("status", None)
        selected_ids = request.data.get("selected_ids", [])
        unselected_ids = request.data.get("unselected_ids", [])
        payment_lot_id = request.data.get("payment_lot_id", None)

        user = self.request.user

        task = payments_bulk_update(
            select_all=select_all,
            selected_ids=selected_ids,
            unselected_ids=unselected_ids,
            status=status,
            payment_lot_id=payment_lot_id,
            api=None,
            user=user,
        )
        payment_lot = PaymentLot.objects.filter(id=payment_lot_id)
        if payment_lot.exists():
            payment_lot = payment_lot.get()
            payment_lot.task = task
            payment_lot.save()
        return Response(
            {"task": TaskSerializer(instance=task).data},
            status=http_status.HTTP_201_CREATED,
        )
