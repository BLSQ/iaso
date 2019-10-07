import gc
import json
import os
from typing import List, Any
from uuid import uuid4
from subprocess import run, PIPE, CalledProcessError

import boto3
import requests
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator

from hat.settings import SNS_NOTIFICATION_TOPIC


def run_cmd(cmd: List[str], **kwargs: Any) -> str:
    """Helper function to run an external command."""
    args = {
        'stdout': PIPE,
        'stderr': PIPE,
        'check': True,
        **kwargs
    }
    try:
        r = run(cmd, **args)
    except CalledProcessError as exc:
        msg = exc.stdout.decode() + exc.stderr.decode()
        raise Exception('Subprocess error: ' + msg)
    return r.stdout.decode()


def create_shared_filename(suffix: str) -> str:
    """Create a unique filename in the shared directory with given suffix."""
    return '{}/{}{}'.format(settings.SHARED_DIR, str(uuid4()), suffix)


# https://stackoverflow.com/questions/1265665/how-can-i-check-if-a-string-represents-an-int-without-using-try-except
def is_int(s):
    if s is None:
        return False
    try:
        int(s)
        return True
    except ValueError:
        return False


def queryset_iterator(queryset, chunk_size=1000):
    """
    Iterate over a Django Queryset
    Unlike its previous implementation, it does not require to sort on the primary key.
    This method loads a maximum of chunk_size (default: 1000) rows in it's
    memory at the same time while django normally would load all rows in it's
    memory. Using the iterator() method only causes it to not preload all the
    classes.
    From https://github.com/django-import-export/django-import-export/issues/774
    """
    if queryset._prefetch_related_lookups:
        if not queryset.query.order_by:
            # Paginator() throws a warning if there is no sorting attached to the queryset
            queryset = queryset.order_by('pk')
        paginator = Paginator(queryset, chunk_size)
        for index in range(paginator.num_pages):
            yield from paginator.get_page(index + 1)
    else:
        yield from queryset.iterator(chunk_size=chunk_size)


def sns_notify(message):
    """
    Send a notification to an AWS SNS topic.
    The SNS topic arn is configured with an environment variable SNS_NOTIFICATION_TOPIC
    On a developer workstation, define the env vars: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    On beanstalk the credentials are automatically provided but the role needs to be allowed into the SNS policy like:
    {
    "Version": "2008-10-17",
      "Id": "__default_policy_ID",
      "Statement": [
        {
          "Sid": "__default_statement_ID",
          "Effect": "Allow",
          "Principal": {
            "AWS": "*"
          },
          "Action": [
            "SNS:Publish",
            "SNS:RemovePermission",
            "SNS:SetTopicAttributes",
            "SNS:DeleteTopic",
            "SNS:ListSubscriptionsByTopic",
            "SNS:GetTopicAttributes",
            "SNS:Receive",
            "SNS:AddPermission",
            "SNS:Subscribe"
          ],
          "Resource": "arn:aws:sns:eu-central-1:457634672864:backend-prod",
          "Condition": {
            "StringEquals": {
              "AWS:SourceOwner": "457634672864"
            }
          }
        },
        {
          "Sid": "AWSConfigSNSPolicy",
          "Effect": "Allow",
          "Principal": {
            "AWS": "arn:aws:sts::457634672864:assumed-role/aws-elasticbeanstalk-ec2-role/i-043eeca9548142a48"
          },
          "Action": "SNS:Publish",
          "Resource": "arn:aws:sns:eu-central-1:457634672864:backend-prod"
        }
      ]
    }
    :param message: Text message to be sent
    :return: SNS response or None if AWS not configured
    """

    if SNS_NOTIFICATION_TOPIC:
        try:
            client = boto3.client('sns', region_name='eu-central-1')

            response = client.publish(
                TopicArn=SNS_NOTIFICATION_TOPIC,
                Message=str(message)
            )

            return response
        except Exception as exc:
            print("Failed to notify over SNS", str(exc))
            return None
    else:
        return None


def slack_notify(plain_text=None, icon="information_source", channel=None, attachments=None):
    """
    Slack notification. This requires a SLACK_WEBHOOK_URL environment parameter to do anything.
    The URL should look like https://hooks.slack.com/services/xxxxxx/xxxxxxx/xxxxxxxxxxxxxxxxxxxxxxx
    :param plain_text: This parameter can be provided for simple text messages or omitted if attachments are given
    :param icon: Slack icon name for the message
    :param channel: Override the webhook default channel. Can be specified as @edarchis to send to a user
    :param attachments: [
                 {
                     "color": "good", # Can be "warning", "error" or a color hex triplet
                     "fallback": "This text will show if the attachment cannot be shown with rich content",
                     "fields": [
                         {
                             "title": "Title of the field",
                             "value": "Value of the field",
                             "short": "false"  # Will show the field next to another one if there is enough space
                         }
                     ],
                     "text": "Notification text"
                     "pretext": "Shown before the attachments section"
                 }
             ]
    :return: Nothing
    """
    url = os.environ.get("SLACK_WEBHOOK_URL", None)
    if not channel:
        channel = os.environ.get("SLACK_CHANNEL", "#sleeping-sickness")
    if url:
        if ":" not in icon:
            icon = ":" + icon + ":"
        if "#" not in channel and "@" not in channel:
            channel = "#" + channel

        notif = {
                    "username": os.environ.get("SLACK_USERNAME", "incoming-webhook"),
                    "icon_emoji": icon,
                    "channel": channel,
                }
        if attachments:
            notif["attachments"] = attachments
        if plain_text:
            notif["text"] = plain_text
        try:
            response = requests.post(
                url=url,
                headers={
                    "Content-Type": "application/json; charset=utf-8",
                },
                data=json.dumps(notif)
            )
        except requests.exceptions.RequestException:
            pass  # This is notification, it shouldn't crash the application.


def get_request_as_array(request_get_or_post, item, default_list=[]):
    param = request_get_or_post.get(item, None)
    if param is None:
        return default_list
    else:
        return [int(x) for x in param.split(',')]


ANONYMOUS_PLACEHOLDER = "•••••••••••"
