import base64
import json
import os
import time
from datetime import datetime, timedelta
from logging import getLogger

import gspread
from gspread import Client
from gspread.exceptions import APIError
from oauth2client.service_account import ServiceAccountCredentials

logger = getLogger(__name__)


DIRNAME = os.path.dirname(__file__)
SCOPES = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/spreadsheets",
]


class QuotaLimiter:
    """This class allow limiting the number of call to an API within the allowed quota.

    Just call the function and then it will wait before returning if we are over the rate.
    The limit on the google sheet API is 60 call per seconds per project, we will limit to half that
    because we may not be the only sessions using the API Key"""

    RANGE_SECONDS = 60
    CALL_RANGE_LIMIT = 30

    def __init__(self):
        # keep a list of call time
        self.calls = []

    @property
    def num_calls(self):
        "Num of call done in the last RANGE_SECONDS"
        # prune calls from before the limit. no need to keep the old one and prevent memory leak
        self.calls = list(filter(lambda d: d > datetime.now() - timedelta(seconds=self.RANGE_SECONDS), self.calls))
        return len(self.calls)

    def limit(self):
        # Removing call older than limit
        while self.num_calls > self.CALL_RANGE_LIMIT:
            logger.info(f"Quota: {self.num_calls} calls in last {self.CALL_RANGE_LIMIT}s. Above rate, waiting")
            time.sleep(3)
        self.calls.append(datetime.now())


# make it a global because we recreate a client per request
quota = QuotaLimiter()


class IasoClient(Client):
    """GoogleSheet client to not hit google rate limit

    Take a belt and braces approach to be sure, try to avoid the limit client side
    but since it can fail (other sessions using the key, rate change etc...)
    it will reattempt the request a few times, while sleeping in between
    """

    total_count = 0

    def request(self, *args, **kwargs):
        logger.debug(f"{self.total_count}, {args}, {kwargs}")
        self.total_count += 1
        global quota
        quota.limit()

        attempt = 0
        while True:
            try:
                return super().request(*args, **kwargs)
            except APIError as e:
                if e.response.status_code != 429 or attempt >= 4:
                    logger.exception(e)
                    raise
                else:
                    # Will still log in sentry so we can track
                    logger.info(f"Hitting rate limit error from google, sleeping")
                    attempt += 1
                    time.sleep(10)


def get_client():
    encoded_config = os.environ.get("GOOGLE_API_KEY_BASE64")
    decoded_config = base64.b64decode(encoded_config)
    data = json.loads(decoded_config)
    creds = ServiceAccountCredentials.from_json_keyfile_dict(data, SCOPES)
    return gspread.authorize(creds, IasoClient)
