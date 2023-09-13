import datetime
import datetime as dt
from datetime import timedelta

from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404

from hat import settings
from iaso.models import Team
from plugins.polio.models import VaccineAuthorization


def vaccine_authorizations_60_days_expiration_email_alert():
    future_date = dt.date.today() + timedelta(days=60)
    vaccine_auths = VaccineAuthorization.objects.filter(expiration_date=future_date)

    team = get_object_or_404(Team, name="nOPV2 vaccine authorization alerts")
    vaccine_dashboard_link = (
        f"{Site.objects.get_current()}/"
        + "/dashboard/polio/vaccinemodule/nopv2authorisation/accountId/{0}/order/-current_expiration_date/pageSize/20/page/1".format(
            team.project.account.id
        )
    )

    mailing_list = [user.email for user in User.objects.filter(pk__in=team.users.all())]

    mail_sent = False

    for obj in vaccine_auths:
        next_vaccine_auth = (
            VaccineAuthorization.objects.filter(
                country=obj.country, status__in=["ONGOING", "SIGNATURE"], deleted_at__isnull=True
            )
            .order_by("-expiration_date")
            .first()
        )

        if next_vaccine_auth and obj.expiration_date < next_vaccine_auth.expiration_date:
            send_mail(
                f"ALERT: Vaccine Authorization {obj} arrives to expiration date in 2 months",
                f"""
                ALERT, 

                {obj.country} nOPV2 vaccines authorization date will expire on {obj.expiration_date}.
                A new authorization is {next_vaccine_auth}, with an expiry date on {next_vaccine_auth.expiration_date}.
                Please take appropriate action as needed. 
                Link to the platform vaccine authorization page : {vaccine_dashboard_link} 
                RRT team
                """,
                settings.DEFAULT_FROM_EMAIL,
                mailing_list,
            )

            mail_sent = True
        else:
            send_mail(
                f"ALERT: Vaccine Authorization {obj} arrives to expiration date in 2 months",
                f"""
                            ALERT

                            {obj.country} nOPV2 vaccines authorization date will expire on {obj.expiration_date}.
                            No new authorization pending.
                            Please take appropriate action as needed. 
                            Link to the platform vaccine authorization page : {vaccine_dashboard_link} 
                            RRT team
                            """,
                settings.DEFAULT_FROM_EMAIL,
                mailing_list,
            )

            mail_sent = True

    return {"vacc_auth_mail_sent_to": mailing_list} if mail_sent else "no_vacc_auth_mail_sent"


def expired_vaccine_authorizations_email_alert():
    past_date = dt.date.today() - timedelta(days=1)
    vaccine_auths = VaccineAuthorization.objects.filter(expiration_date=past_date)

    team = get_object_or_404(Team, name="nOPV2 vaccine authorization alerts")
    vaccine_dashboard_link = (
        f"{Site.objects.get_current()}/"
        + "/dashboard/polio/vaccinemodule/nopv2authorisation/accountId/{0}/order/-current_expiration_date/pageSize/20/page/1".format(
            team.project.account.id
        )
    )

    mailing_list = [user.email for user in User.objects.filter(pk__in=team.users.all())]

    mail_sent = False

    for obj in vaccine_auths:
        next_vaccine_auth = (
            VaccineAuthorization.objects.filter(
                country=obj.country, status__in=["ONGOING", "SIGNATURE"], deleted_at__isnull=True
            )
            .order_by("-expiration_date")
            .first()
        )

        if next_vaccine_auth and obj.expiration_date < next_vaccine_auth.expiration_date:
            send_mail(
                f"ALERT: Vaccine Authorization {obj} has expired.",
                f"""
                ALERT, 

                {obj.country} nOPV2 vaccines authorization has expired expired on {obj.expiration_date}.
                A new authorization is ongoing {next_vaccine_auth}, with an expiry date on {next_vaccine_auth.expiration_date}.
                Please take appropriate action as needed. 
                Link to the platform vaccine authorization page : {vaccine_dashboard_link}
                RRT team
                """,
                settings.DEFAULT_FROM_EMAIL,
                mailing_list,
            )
            mail_sent = True
        else:
            send_mail(
                f"ALERT: Vaccine Authorization {obj} has expired.",
                f"""
                            ALERT

                            {obj.country} nOPV2 vaccines authorization has expired on {obj.expiration_date}.
                            No new authorization pending.
                            Please take appropriate action as needed. 
                            Link to the platform vaccine authorization page : {vaccine_dashboard_link} 
                            RRT team
                            """,
                settings.DEFAULT_FROM_EMAIL,
                mailing_list,
            )
            mail_sent = True

    return {"vacc_auth_mail_sent_to": mailing_list} if mail_sent else "no_vacc_auth_mail_sent"


def vaccine_authorization_update_expired_entries():
    expired_vacc_auth = VaccineAuthorization.objects.filter(expiration_date=datetime.date.today() - timedelta(days=1))

    for vacc_auth in expired_vacc_auth:
        vacc_auth.status = "EXPIRED"
        vacc_auth.save()
