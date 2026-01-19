from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import send_mail

from hat import settings
from iaso.api.common import (
    Custom403Exception,
)
from iaso.models import Team
from plugins.polio.models import (
    Campaign,
    Round,
)
from plugins.polio.preparedness.spreadsheet_manager import (
    Campaign,
)
from plugins.polio.settings import NOPV2_VACCINE_TEAM_NAME


def send_missing_vaccine_authorization_for_campaign_email(obr_name, org_unit, account):
    try:
        users = [user for user in Team.objects.get(name=NOPV2_VACCINE_TEAM_NAME).users.all()]
        recipient_list = [user.email for user in users]
        subject = f"Vaccine Authorization missing for campaign OBR Name {obr_name}"
        message = f"""
        Dear team,

        The campaign {obr_name} for {org_unit} has been created in the poliooutbreaks platform.

        Please note that no nOPV2 authorization has been recorded in the platform for {org_unit} yet. 

        Be aware that {org_unit} does not have any nOPV2 authorization recorded into the platform yet.

        To add one, please follow this link: https://www.poliooutbreaks.com/dashboard/polio/vaccinemodule/nopv2authorisation/accountId/{account.pk}/

        This is an automated message from the poliooutbreaks platform.
            """

        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list)
    except ObjectDoesNotExist:
        pass


def check_total_doses_requested(vaccine_authorization, nOPV2_rounds, current_campaign):
    """
    Check if the total doses requested per round in a campaign is not superior to the allowed doses in the vaccine authorization.
    It also emails the nopv2 vaccine team about it.
    """
    if vaccine_authorization and vaccine_authorization.quantity is not None:
        campaigns = Campaign.objects.filter(country=vaccine_authorization.country, deleted_at__isnull=True).exclude(
            pk=current_campaign.pk
        )
        total_doses_requested_for_campaigns = 0
        campaigns_rounds = [c_round for c_round in Round.objects.filter(campaign__in=campaigns)]

        existing_nopv2_rounds = []
        for r in campaigns_rounds:
            if "nOPV2" in r.vaccine_names:
                existing_nopv2_rounds.append(r)

        for r in existing_nopv2_rounds:
            if r.started_at and r.doses_requested:
                if vaccine_authorization.start_date <= r.started_at <= vaccine_authorization.expiration_date:
                    total_doses_requested_for_campaigns += r.doses_requested

        total_doses_requested = 0
        for c_round in nOPV2_rounds:
            if c_round.doses_requested is not None:
                if c_round.started_at >= vaccine_authorization.start_date <= vaccine_authorization.expiration_date:
                    total_doses_requested += c_round.doses_requested

        if total_doses_requested + total_doses_requested_for_campaigns > vaccine_authorization.quantity:
            message = f"The total of doses requested {total_doses_requested} is superior to the autorized doses for this campaign {vaccine_authorization.quantity}."
            if total_doses_requested_for_campaigns > 0:
                message = f"The total of doses requested {total_doses_requested} and the aggregation of all previous requested doses {total_doses_requested_for_campaigns} are superior to the autorized doses for this campaign {vaccine_authorization.quantity}."
            raise Custom403Exception(message)
