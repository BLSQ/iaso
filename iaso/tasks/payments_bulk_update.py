from copy import deepcopy
from time import time
from typing import List
from django.db import transaction
from beanstalk_worker import task_decorator
from hat.audit import models as audit_models
from iaso.models import Task
from iaso.models.payments import Payment


def update_payment_from_bulk(
    user,
    payment,
    *,
    status,
):
    """Used within the context of a bulk operation"""

    original_copy = deepcopy(payment)
    if status is not None and status in Payment.Statuses:
        payment.status = status
    payment.save()

    audit_models.log_modification(original_copy, payment, source=audit_models.PAYMENT_API_BULK, user=user)


@task_decorator(task_name="payments_bulk_update")
def payments_bulk_update(
    select_all: bool,
    selected_ids: List[int],
    unselected_ids: List[int],
    status: str,
    task: Task,
):
    """Background Task to bulk update payments."""
    start = time()
    the_task=task
    the_task.report_progress_and_stop_if_killed(progress_message="Searching for Payments to modify")

    # Restrict qs to payments accessible to the user
    user = the_task.launcher
    queryset = Payment.objects.filter(created_by__iaso_profile__account=user.iaso_profile.account)

    if not select_all:
        queryset = queryset.filter(pk__in=selected_ids)
    else:
        queryset = queryset.exclude(pk__in=unselected_ids)

    if not queryset:
        raise Exception("No matching payment found")

    total = queryset.count()

    # FIXME Task don't handle rollback properly if task is killed by user or other error
    with transaction.atomic():
        for index, org_unit in enumerate(queryset.iterator()):
            res_string = "%.2f sec, processed %i payments" % (time() - start, index)
            the_task.report_progress_and_stop_if_killed(progress_message=res_string, end_value=total, progress_value=index)
            update_payment_from_bulk(
                user,
                org_unit,
                status=status,
            )

        the_task.report_success(message="%d modified" % total)
