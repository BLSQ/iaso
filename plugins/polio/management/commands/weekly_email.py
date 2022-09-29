from logging import getLogger

from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils.timezone import now

from plugins.polio.models import Campaign, CountryUsersGroup, Round
from plugins.polio.serializers import preparedness_from_url

logger = getLogger(__name__)


# TODO Add to message SOPs : Standard operating procedure
#  As per the outbreak response plan the\
#  country has completed (activity done as per SOPs) and is now looking forward to (Next activity on SOPs).


def get_last_preparedness(campaign):
    try:
        round = campaign.rounds.filter(campaign__preparedness__spreadsheet_url__isnull=False).latest("number")
        preparedness_from_url(round.preparedness_spreadsheet_url)
    except Round.DoesNotExist:
        return {}


def send_notification_email(campaign):
    country = campaign.country
    domain = settings.DNS_DOMAIN
    from_email = settings.DEFAULT_FROM_EMAIL

    if not (campaign.obr_name and campaign.virus and country and campaign.onset_at and campaign.deleted_at is None):
        return False
    try:
        cug = CountryUsersGroup.objects.get(country=country)
    except CountryUsersGroup.DoesNotExist:
        return False
    users = cug.users.all()
    emails = [user.email for user in users if user.email]
    if not emails:
        return False
    day_number = (now().date() - campaign.cvdpv_notified_at).days if campaign.cvdpv_notified_at else ""
    onset_days = (
        (campaign.cvdpv_notified_at - campaign.onset_at).days
        if campaign.onset_at and campaign.cvdpv_notified_at
        else ""
    )
    try:
        first_round = campaign.rounds.earliest("number")
    except Round.DoesNotExist:
        first_round = None
    round1_days = (
        (first_round.started_at - campaign.onset_at).days
        if first_round and first_round.started_at and campaign.cvdpv_notified_at
        else ""
    )
    c = campaign
    url = f"https://{domain}/dashboard/polio/list/campaignId/{campaign.id}"
    # format thousand
    target_population = f"{first_round.target_population:,}" if first_round and first_round.target_population else ""

    preparedness = get_last_preparedness(campaign)

    email_text = f"""Dear GPEI coordinator – {country.name},

Weekly status update: Today is day {day_number} since outbreak notification.
Below is the summary of the campaign {c.obr_name}. for more details, visit https://afro-rrt-who.hub.arcgis.com/pages/country-summary
If there are missing data or dates; visit {url} to update

* Notification date              : {c.cvdpv2_notified_at}
* First round                    : {first_round.started_at if first_round and first_round.started_at else ''}
* Vaccine Type                   : {c.vaccines}
* Target population              : {target_population} 
* RA Status                      : {c.get_risk_assessment_status_display() or 'Pending'}
* SIA Budget Status              : {c.get_budget_status_display() or 'Pending'}
* Date Budget submitted          : {c.budget_submitted_at}
* OnSet to Notification (Days)   : {onset_days}
* Round 1 to Notification (Days) : {round1_days}
* Prep. national                 : {preparedness.get('national_score') if preparedness else ''}
* Prep. regional                 : {preparedness.get('regional_score') if preparedness else ''}
* Prep. district                 : {preparedness.get('district_score') if preparedness else ''}

For guidance on updating: contact RRT team
Timeline tracker Automated message.
    """

    logger.info(f"Sending to {len(emails)} recipients")

    send_mail(
        "Update on Campaign {}".format(campaign.obr_name),
        email_text,
        from_email,
        emails,
    )

    return True


class Command(BaseCommand):
    """Send an e-mail to all GPEI coordinator for the campaign
    run weekly email after the refresh so data is up to date
    """

    def handle(self, *args, **options):
        campaigns = Campaign.objects.exclude(enable_send_weekly_email=False)

        for campaign in campaigns:
            latest_round_end = campaign.rounds.order_by("ended_at").last()
            if latest_round_end and latest_round_end.ended_at and latest_round_end.ended_at > now().date():
                print(f"Campaign {campaign} is finished, skipping")
                continue
            logger.info(f"Email for {campaign.obr_name}")
            status = send_notification_email(campaign)
            if not status:
                logger.info(f"... skipped")

        logger.info(f"Finished weekly-email")
