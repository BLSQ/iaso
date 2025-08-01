import datetime
import datetime as dt

from datetime import timedelta
from logging import getLogger

from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404

from beanstalk_worker import task_decorator
from hat import settings
from iaso.models import Profile, Team
from plugins.polio.models import VaccineAuthorization
from plugins.polio.settings import NOPV2_VACCINE_TEAM_NAME


logger = getLogger(__name__)

vaccine_dashboard_link = settings.DNS_DOMAIN


def vaccine_authorizations_60_days_expiration_email_alert(vaccine_auths, mailing_list):
    for obj in vaccine_auths:
        account_id = obj.account.id
        next_vaccine_auth = (
            VaccineAuthorization.objects.filter(
                country=obj.country, status__in=["ONGOING", "SIGNATURE"], deleted_at__isnull=True
            )
            .order_by("-expiration_date")
            .first()
        )

        if next_vaccine_auth and obj.expiration_date < next_vaccine_auth.expiration_date:
            try:
                send_mail(
                    f"ALERT: Vaccine Authorization {obj} arrives to expiration date in 2 months",
                    f"""
                    ALERT, 

                    {obj.country} nOPV2 vaccines authorization date will expire on {obj.expiration_date}.
                    A new authorization is {next_vaccine_auth}, with an expiry date on {next_vaccine_auth.expiration_date}.
                    Please take appropriate action as needed. 
                    Link to the platform vaccine authorization page : {vaccine_dashboard_link}/dashboard/polio/vaccinemodule/nopv2authorisation/accountId/{account_id}/order/-current_expiration_date/pageSize/20/page/1"
                    RRT team
                    """,
                    settings.DEFAULT_FROM_EMAIL,
                    mailing_list,
                )

            except Exception as e:
                logger.error(f"Could not send emails for {obj}")
                raise e
        else:
            try:
                send_mail(
                    f"ALERT: Vaccine Authorization {obj} arrives to expiration date in 2 months",
                    f"""
                                ALERT

                                {obj.country} nOPV2 vaccines authorization date will expire on {obj.expiration_date}.
                                No new authorization pending.
                                Please take appropriate action as needed. 
                                Link to the platform vaccine authorization page : {vaccine_dashboard_link}/dashboard/polio/vaccinemodule/nopv2authorisation/accountId/{account_id}/order/-current_expiration_date/pageSize/20/page/1""
                                RRT team
                                """,
                    settings.DEFAULT_FROM_EMAIL,
                    mailing_list,
                )

            except Exception as e:
                logger.error(f"Could not send emails for {obj}")
                raise e

    return {"vacc_auth_mail_sent_to": mailing_list}


@task_decorator(task_name="vaccine_authorizations_60_days_expiration_email_alert")
def send_email_vaccine_authorizations_60_days_expiration_alert(task=None):
    # NOTE: If any change is made to the mailing list building it should be replicated in the corresponding test too.
    # Test Name:  test_send_email_vaccine_authorizations_mailing_list_builder
    future_date = dt.date.today() + timedelta(days=60)
    vaccine_auths = VaccineAuthorization.objects.filter(expiration_date=future_date)
    total = vaccine_auths.count()

    team = get_object_or_404(Team, name=NOPV2_VACCINE_TEAM_NAME)
    # Convert to list so we can append the GPEI coordinator email later
    mailing_list = list(User.objects.filter(pk__in=team.users.all()).values_list("email", flat=True))
    email_sent = 0

    for i, vacc_auth in enumerate(vaccine_auths):
        try:
            gpei_coordinator = Profile.objects.get(user__username__istartswith="gpei", org_units=vacc_auth.country)
            mailing_list.append(gpei_coordinator.user.email)
        except ObjectDoesNotExist:
            pass
        task.report_progress_and_stop_if_killed(
            progress_value=i,
            end_value=total,
            progress_message=f"Campaign {vacc_auth.pk} started",
        )

        logger.info(f"Email for {vacc_auth}")
        try:
            status = vaccine_authorizations_60_days_expiration_email_alert(vaccine_auths, mailing_list)
            if not status:
                logger.info("... skipped")
        except Exception as e:
            task.terminate_with_error(message=str(e))
            raise e
        else:
            email_sent += 1

    task.report_success(f"Finished sending {email_sent} nOPV2 vaccine authorization alertsemail(s)")


def expired_vaccine_authorizations_email_alert(vaccine_auths, mailing_list):
    for obj in vaccine_auths:
        account_id = obj.account.id
        next_vaccine_auth = (
            VaccineAuthorization.objects.filter(
                country=obj.country, status__in=["ONGOING", "SIGNATURE"], deleted_at__isnull=True
            )
            .order_by("-expiration_date")
            .first()
        )

        if next_vaccine_auth and obj.expiration_date < next_vaccine_auth.expiration_date:
            try:
                send_mail(
                    f"ALERT: Vaccine Authorization {obj} has expired.",
                    f"""
                    ALERT, 

                    {obj.country} nOPV2 vaccines authorization has expired expired on {obj.expiration_date}.
                    A new authorization is ongoing {next_vaccine_auth}, with an expiry date on {next_vaccine_auth.expiration_date}.
                    Please take appropriate action as needed. 
                    Link to the platform vaccine authorization page : {vaccine_dashboard_link}/dashboard/polio/vaccinemodule/nopv2authorisation/accountId/{account_id}/order/-current_expiration_date/pageSize/20/page/1"
                    RRT team
                    """,
                    settings.DEFAULT_FROM_EMAIL,
                    mailing_list,
                )
            except Exception as e:
                logger.error(f"Could not send emails for {obj}")
                raise e
        else:
            try:
                send_mail(
                    f"ALERT: Vaccine Authorization {obj} has expired.",
                    f"""
                                ALERT

                                {obj.country} nOPV2 vaccines authorization has expired on {obj.expiration_date}.
                                No new authorization pending.
                                Please take appropriate action as needed. 
                                Link to the platform vaccine authorization page : {vaccine_dashboard_link}/dashboard/polio/vaccinemodule/nopv2authorisation/accountId/{account_id}/order/-current_expiration_date/pageSize/20/page/1"
                                RRT team
                                """,
                    settings.DEFAULT_FROM_EMAIL,
                    mailing_list,
                )
            except Exception as e:
                logger.error(f"Could not send emails for {obj}")
                raise e

    return {"vacc_auth_mail_sent_to": mailing_list}


@task_decorator(task_name="expired_vaccine_authorizations_email_alert")
def send_email_expired_vaccine_authorizations_alert(task=None):
    past_date = dt.date.today() - timedelta(days=1)
    team = get_object_or_404(Team, name=NOPV2_VACCINE_TEAM_NAME)
    vaccine_auths = VaccineAuthorization.objects.filter(expiration_date=past_date)
    # Convert to list so we can append the GPEI coordinator email later
    mailing_list = list(team.users.values_list("email", flat=True))
    total = vaccine_auths.count()

    email_sent = 0

    for i, vacc_auth in enumerate(vaccine_auths):
        try:
            gpei_coordinator = Profile.objects.get(user__username__istartswith="gpei", org_units=vacc_auth.country)
            mailing_list.append(gpei_coordinator.user.email)
        except ObjectDoesNotExist:
            pass
        task.report_progress_and_stop_if_killed(
            progress_value=i,
            end_value=total,
            progress_message=f"Campaign {vacc_auth.pk} started",
        )

        logger.info(f"Email for {vacc_auth}")
        try:
            status = expired_vaccine_authorizations_email_alert(vaccine_auths, mailing_list)
            if not status:
                logger.info("... skipped")
        except Exception as e:
            task.terminate_with_error(message=str(e))
            raise e
        else:
            email_sent += 1

    task.report_success(f"Finished sending {email_sent} nOPV2 vaccine authorization alert email(s)")


@task_decorator(task_name="vaccine_authorization_update_expired_entries")
def vaccine_authorization_update_expired_entries(task=None):
    # NOTE: If any change is made to the mailing list building it should be replicated in the corresponding test too.
    # Test Name:  test_send_email_vaccine_authorizations_mailing_list_builder
    expired_vacc_auth = VaccineAuthorization.objects.filter(expiration_date__lt=datetime.date.today())
    total = expired_vacc_auth.count()

    expired_auth = 0

    for i, vacc_auth in enumerate(expired_vacc_auth):
        task.report_progress_and_stop_if_killed(
            progress_value=i,
            end_value=total,
            progress_message=f"Campaign {vacc_auth.pk} started",
        )

        vacc_auth.status = "EXPIRED"
        vacc_auth.save()

        logger.info(f"Campaign {vacc_auth} has expired.")
        if total == 0:
            logger.info("... skipped")
        else:
            expired_auth += 1

    task.report_success(f"{expired_auth} expired nOPV2 vaccine authorization.")
