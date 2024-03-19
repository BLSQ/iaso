from copy import deepcopy
from time import time
from typing import List
from django.db import transaction
from beanstalk_worker import task_decorator
from hat.audit import models as audit_models
from iaso.api.payments.serializers import PaymentLotAuditLogger
from iaso.models import Task
from iaso.models.base import ERRORED
from iaso.models.payments import Payment, PaymentLot
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist


def update_payment_from_bulk(user, payment, *, status, api):
    """Used within the context of a bulk operation"""

    original_copy = deepcopy(payment)
    source = api if api else audit_models.PAYMENT_API_BULK
    if status is not None and status in Payment.Statuses:
        payment.status = status
    payment.save()

    audit_models.log_modification(original_copy, payment, source=source, user=user)


@task_decorator(task_name="payments_bulk_update")
def payments_bulk_update(
    select_all: bool,
    selected_ids: List[int],
    unselected_ids: List[int],
    status: str,
    payment_lot_id: int,
    api,
    task: Task,
):
    """Background Task to bulk update payments.
    All updated payments should be related to the provided payment_lot_id
    """
    start = time()
    the_task = task
    the_task.report_progress_and_stop_if_killed(progress_message="Searching for Payments to modify")
    if not payment_lot_id:
        the_task.status = ERRORED
        the_task.ended_at = timezone.now()
        the_task.result = {"result": ERRORED, "message": "Missing PaymentLot id"}
        the_task.save()
    else:
        try:
            payment_lot = PaymentLot.objects.get(id=payment_lot_id)
        except ObjectDoesNotExist:
            the_task.status = ERRORED
            the_task.ended_at = timezone.now()
            the_task.result = {"result": ERRORED, "message": "Payment Lot not found"}
            the_task.save()
        payment_log_audit = PaymentLotAuditLogger()
        old_payment_lot = payment_log_audit.serialize_instance(payment_lot=payment_lot)
        # Restrict qs to payments accessible to the user
        user = the_task.launcher
        queryset = Payment.objects.filter(created_by__iaso_profile__account=user.iaso_profile.account).filter(
            payment_lot_id=payment_lot_id
        )

        if not select_all:
            queryset = queryset.filter(pk__in=selected_ids)
        else:
            queryset = queryset.exclude(pk__in=unselected_ids)

        if not queryset:
            raise Exception("No matching payment found")

        total = queryset.count()

        # FIXME Task don't handle rollback properly if task is killed by user or other error
        with transaction.atomic():
            for index, payment in enumerate(queryset.iterator()):
                res_string = "%.2f sec, processed %i payments" % (time() - start, index)
                the_task.report_progress_and_stop_if_killed(
                    progress_message=res_string, end_value=total, progress_value=index
                )
                update_payment_from_bulk(user, payment, status=status, api=api)
            old_payment_lot_status = payment_lot.status
            new_payment_lot_status = payment_lot.compute_status()
            if old_payment_lot_status != new_payment_lot_status:
                payment_lot.status = new_payment_lot_status
                payment_lot.save()
                payment_log_audit.log_modification(
                    old_data_dump=old_payment_lot, instance=payment_lot, source=audit_models.PAYMENT_API_BULK
                )
            the_task.report_success(message="%d modified" % total)


@task_decorator(task_name="mark_payments_as_read")
def mark_payments_as_read(
    payment_lot: PaymentLot,
    payments,  # Queryset
    api,
    task: Task,
):
    """
    Task to change the `status` of  all `Payments` in a `PaymentLot` to `SENT`
    It's launched via the `PaymentLot` API only, so the check on access rights is performed there
    """
    start = time()
    the_task = task
    user = the_task.launcher
    the_task.report_progress_and_stop_if_killed(progress_message="Searching for Payments to modify")
    total = payments.count()
    audit_logger = PaymentLotAuditLogger()
    old_payment_lot = audit_logger.serialize_instance(payment_lot)
    # FIXME Task don't handle rollback properly if task is killed by user or other error
    with transaction.atomic():
        for index, payment in enumerate(payments.iterator()):
            res_string = "%.2f sec, processed %i payments" % (time() - start, index)
            the_task.report_progress_and_stop_if_killed(
                progress_message=res_string, end_value=total, progress_value=index
            )
            update_payment_from_bulk(user, payment, status=Payment.Statuses.SENT, api=api)
        payment_lot.compute_status()
        payment_lot.save()
        audit_logger.log_modification(old_data_dump=old_payment_lot, instance=payment_lot, request_user=user)
        the_task.report_success(message="%d modified" % total)
