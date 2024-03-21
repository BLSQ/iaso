from time import time
from django.db import transaction
from beanstalk_worker import task_decorator
from hat.audit import models as audit_models
from iaso.api.org_unit_change_requests.serializers import (
    OrgUnitChangeRequestAuditLogger,
)
from typing import List
from iaso.api.payments.serializers import PaymentAuditLogger, PaymentLotAuditLogger
from iaso.models import Task
from iaso.models.payments import Payment, PaymentLot, PotentialPayment
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist
from iaso.models.base import ERRORED


def create_payment_from_payment_lot(user, payment_lot, *, potential_payment):
    """Used within the context of a bulk operation"""
    payment = Payment.objects.create(
        status=Payment.Statuses.PENDING,
        user=potential_payment.user,
        created_by=user,
        updated_by=user,
        payment_lot=payment_lot,
    )
    # Save payment modification
    audit_logger = PaymentAuditLogger()
    change_request_audit_logger = OrgUnitChangeRequestAuditLogger()
    change_requests = potential_payment.change_requests.all()
    # Add change requests from potential payment to the newly created payment
    for change_request in change_requests:
        old_change_request_dump = change_request_audit_logger.serialize_instance(change_request)
        change_request.payment = payment
        change_request.potential_payment = None
        change_request.save()
        # Save change request modification
        change_request_audit_logger.log_modification(
            instance=change_request,
            old_data_dump=old_change_request_dump,
            request_user=user,
            source=audit_models.PAYMENT_LOT_API,
        )
    potential_payment.delete()
    # Log the payment change after the fk to change request has been set
    audit_logger.log_modification(
        instance=payment, old_data_dump=None, request_user=user, source=audit_models.PAYMENT_LOT_API
    )


@task_decorator(task_name="create_payments_from_payment_lot")
def create_payments_from_payment_lot(
    payment_lot_id: int,
    potential_payment_ids: List[int],
    task: Task,
):
    """Background Task to bulk update payments related to specific PaymentLot
    Used exclusively within the context of the PaymentLot API. Users won't launch it directly from another endpoint.
    """
    start = time()
    the_task = task
    the_task.report_progress_and_stop_if_killed(progress_message="Searching for Payments to modify")
    try:
        payment_lot = PaymentLot.objects.get(id=payment_lot_id)
    except ObjectDoesNotExist:
        the_task.status = ERRORED
        the_task.ended_at = timezone.now()
        the_task.result = {"result": ERRORED, "message": "Payment Lot not found"}
        the_task.save()

    potential_payments = PotentialPayment.objects.filter(id__in=potential_payment_ids)
    total = len(potential_payment_ids)
    if potential_payments.count() != total:
        the_task.status = ERRORED
        the_task.ended_at = timezone.now()
        the_task.result = {"result": ERRORED, "message": "One or several Potential payments not found"}
        the_task.save()
        raise ObjectDoesNotExist
    user = the_task.launcher
    audit_logger = PaymentLotAuditLogger()
    old_payment_lot_dump = audit_logger.serialize_instance(payment_lot)
    with transaction.atomic():
        for index, potential_payment in enumerate(potential_payments.iterator()):
            res_string = "%.2f sec, processed %i payments" % (time() - start, index)
            the_task.report_progress_and_stop_if_killed(
                progress_message=res_string, end_value=total, progress_value=index
            )
            create_payment_from_payment_lot(user=user, payment_lot=payment_lot, potential_payment=potential_payment)
    payment_lot.compute_status()
    payment_lot.save()
    audit_logger.log_modification(instance=payment_lot, old_data_dump=old_payment_lot_dump, request_user=user)
    the_task.report_success(message="%d modified" % total)
