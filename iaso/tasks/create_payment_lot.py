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
from iaso.models.payments import Payment, PaymentLot, PaymentStatuses, PotentialPayment
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist
from iaso.models.base import ERRORED


def create_payment_from_payment_lot(user, payment_lot, *, potential_payment):
    """Used within the context of a bulk operation"""
    payment = Payment.objects.create(
        status=PaymentStatuses.PENDING,
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


@task_decorator(task_name="create_payment_lot")
def create_payment_lot(
    comment: str,
    name: str,
    potential_payment_ids: List[int],
    task: Task,
):
    """Background Task to bulk update payments related to specific PaymentLot
    Used exclusively within the context of the PaymentLot API. Users won't launch it directly from another endpoint.
    """
    start = time()
    the_task = task
    user = the_task.launcher
    the_task.report_progress_and_stop_if_killed(progress_message="Searching for Payments to modify")
    payment_lot = PaymentLot(name=name, comment=comment, created_by=user, updated_by=user)
    payment_lot.task = the_task
    payment_lot.save()

    # Addding a try/except so if there's an error while adding the potential payments, we can delete the payment lot and avoid empty payment lots in the DB
    # TODO Not sure we need to add the potential payments to the payment lot anymore
    try:
        potential_payments = PotentialPayment.objects.filter(id__in=potential_payment_ids, task__isnull=True)
        payment_lot.potential_payments.add(*potential_payments, bulk=False)
        payment_lot.save()
    except:
        the_task.status = ERRORED
        the_task.ended_at = timezone.now()
        the_task.result = {"result": ERRORED, "message": "Error while getting potential payments"}
        the_task.save()
        payment_lot.delete()

    total = len(potential_payment_ids)
    if potential_payments.count() != total:
        the_task.status = ERRORED
        the_task.ended_at = timezone.now()
        the_task.result = {"result": ERRORED, "message": "One or several Potential payments not found"}
        the_task.save()
        payment_lot.delete()
    else:
        with transaction.atomic():
            for index, potential_payment in enumerate(potential_payments.iterator()):
                potential_payment.task = the_task
                potential_payment.payment_lot = payment_lot
                potential_payment.save()
                res_string = "%.2f sec, processed %i payments" % (time() - start, index)
                the_task.report_progress_and_stop_if_killed(
                    progress_message=res_string, end_value=total, progress_value=index
                )
                create_payment_from_payment_lot(user=user, payment_lot=payment_lot, potential_payment=potential_payment)
        # If potential payments haven't been deleted, it means there was a problem with the above transaction and it was reverted.
        # In this case we delete the payment lot and ERROR the task
        if payment_lot.potential_payments.count():
            the_task.status = ERRORED
            the_task.ended_at = timezone.now()
            the_task.result = {"result": ERRORED, "message": "Error while creating one or several payments"}
            the_task.save()
            payment_lot.delete()
        else:
            audit_logger = PaymentLotAuditLogger()
            # Compute status, although it should be NEW since we just created all the Payments
            payment_lot.compute_status()
            payment_lot.save()
            audit_logger.log_modification(instance=payment_lot, old_data_dump=None, request_user=user)
            the_task.report_success(message="%d modified" % total)
