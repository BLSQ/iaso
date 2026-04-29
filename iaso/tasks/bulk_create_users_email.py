"""Background task for sending bulk email invitations."""

from typing import List

from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils import translation
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from beanstalk_worker import task_decorator
from iaso.api.profiles.views import ProfilesViewSet
from iaso.mail.branding import core_email_branding_context


@task_decorator(task_name="send_bulk_email_invitations")
def send_bulk_email_invitations(user_ids: List[int], is_secure: bool, task=None):
    """
    Background task to send email invitations to newly created users.

    Args:
        user_ids: List of user IDs to send invitations to
        is_secure: Whether the original request was HTTPS
        task: Injected Task object for progress tracking
    """
    the_task = task
    if not user_ids:
        if the_task:
            the_task.report_progress_and_stop_if_killed(
                progress_value=100, end_value=100, progress_message="No users to invite"
            )
        return
    domain = settings.DNS_DOMAIN
    protocol = "https" if is_secure else "http"
    token_generator = PasswordResetTokenGenerator()

    total_users = len(user_ids)
    success_count = 0
    error_count = 0

    if the_task:
        the_task.report_progress_and_stop_if_killed(
            progress_value=0,
            end_value=total_users,
            progress_message=f"Starting email invitations for {total_users} users...",
        )

    users = User.objects.select_related("iaso_profile", "iaso_profile__account").filter(id__in=user_ids)

    for i, user in enumerate(users):
        try:
            profile = user.iaso_profile
            language = profile.language or "en"

            token = token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            create_password_path = reverse("reset_password_confirmation", kwargs={"uidb64": uid, "token": token})

            invitation_context = {
                **core_email_branding_context(protocol=protocol, domain=domain),
                "protocol": protocol,
                "domain": domain,
                "account_name": profile.account.name,
                "user_name": user.username,
                "url": f"{protocol}://{domain}{create_password_path}",
            }

            with translation.override(language):
                email_subject = ProfilesViewSet.get_subject_by_language(language=language, domain=domain)
                email_message = render_to_string("emails/create_password_email.txt", invitation_context)
                html_email_content = render_to_string("emails/create_password_email.html", invitation_context)

            send_mail(
                email_subject,
                email_message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                html_message=html_email_content,
                fail_silently=False,
            )

            success_count += 1
            if the_task:
                the_task.report_progress_and_stop_if_killed(
                    progress_value=i + 1,
                    end_value=total_users,
                    progress_message=f"Sending invitations: {success_count} sent, {error_count} failed",
                )

        except Exception as e:
            error_count += 1
            if the_task:
                the_task.report_progress_and_stop_if_killed(
                    progress_value=i + 1,
                    end_value=total_users,
                    progress_message=f"Failed to send email to {user.email}: {e}",
                )
            continue

    if the_task:
        the_task.report_progress_and_stop_if_killed(
            progress_value=total_users,
            end_value=total_users,
            progress_message=f"Email invitations complete: {success_count} sent, {error_count} failed",
        )
