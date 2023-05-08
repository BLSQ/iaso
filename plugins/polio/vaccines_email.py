from logging import getLogger
from typing import List

from django.conf import settings
from django.core.mail import send_mail

logger = getLogger(__name__)


def send_vaccines_notification_email(country_login: str, emails: List[str]):
    from_email = settings.DEFAULT_FROM_EMAIL

    email_text = f""" This is a warning message,
    

You receive this email because the connexion to WHO server for the account {country_login} has failed.
Therefore the vaccines information cannot be retrieved for this country. 

The Iaso Team.
    """

    logger.info(f"Sending to {len(emails)} recipients")

    send_mail(
        f"Automated message: Unable to connect to WHO Server {country_login}",
        email_text,
        from_email,
        emails,
    )

    return True
