import gc
from typing import List, Any
from uuid import uuid4
from subprocess import run, PIPE, CalledProcessError

import boto3
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist

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
    Iterate over a Django Queryset ordered by the primary key
    This method loads a maximum of chunk_size (default: 1000) rows in it's
    memory at the same time while django normally would load all rows in it's
    memory. Using the iterator() method only causes it to not preload all the
    classes.
    Note that the implementation of the iterator does not support ordered query sets.
    source: https://gist.github.com/syrusakbary/7982653
    """
    try:
        last_pk = queryset.order_by('-id')[:1].get().id
    except ObjectDoesNotExist:
        return

    pk = 0
    queryset = queryset.order_by('id')
    while pk < last_pk:
        for row in queryset.filter(id__gt=pk)[:chunk_size]:
            pk = row.id
            yield row
        gc.collect()


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


ANONYMOUS_PLACEHOLDER = "•••••••••••"
