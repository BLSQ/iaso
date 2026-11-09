import logging
import time

import requests


logger = logging.getLogger(__name__)

RETRIES = 4
BACKOFF_FACTOR = 15
# Default connect and read timeouts, in seconds.
TIMEOUT = (10, 600)

RETRIED_ERRORS = (
    requests.exceptions.ConnectionError,  # connection failed, or read timeout while reading the body
    requests.exceptions.Timeout,  # connect or read timeout
    requests.exceptions.ChunkedEncodingError,  # the connection dropped mid-response
    requests.exceptions.JSONDecodeError,  # truncated JSON
)
RETRIED_STATUSES = (429, 500, 502, 503, 504)


class HttpClient:
    """
    Http client with retries and automated backoff configured, and some extra error handling (connection drops
    and partial/invalid responses).
    """

    def __init__(self, base_url="", retries=RETRIES, backoff_factor=BACKOFF_FACTOR, timeout=TIMEOUT):
        self.base_url = base_url
        self.headers = {}
        self.retries = retries
        self.backoff_factor = backoff_factor
        self.timeout = timeout
        self.session = requests.Session()

    def request(self, method, url, **kwargs) -> requests.Response:
        response = self.session.request(
            method, self.base_url + url, headers=self.headers, timeout=self.timeout, **kwargs
        )
        if not response.ok:
            logger.warning(f"{method} {url} failed: {response.status_code} {response.text[:1000]}")
        response.raise_for_status()
        return response

    def get_bytes(self, url, params=None) -> bytes:
        """Return the raw bytes from the response."""
        for attempt in range(self.retries + 1):
            try:
                return self.request("GET", url, params=params).content
            except requests.exceptions.RequestException as error:
                self.retry_or_raise(url, attempt, error)

    def get_json(self, url, params=None):
        """Return the json GET response."""
        for attempt in range(self.retries + 1):
            try:
                return self.request("GET", url, params=params).json()
            except requests.exceptions.RequestException as error:
                self.retry_or_raise(url, attempt, error)

    def retry_or_raise(self, url, attempt, error):
        """Raises `error` when it can't be retried or retries are exhausted, else waits before the next attempt."""
        if isinstance(error, requests.exceptions.HTTPError):
            retried = error.response is not None and error.response.status_code in RETRIED_STATUSES
        else:
            retried = isinstance(error, RETRIED_ERRORS)
        if not retried or attempt == self.retries:
            raise error

        delay = self.backoff_factor * 2**attempt if attempt else 0
        logger.warning(f"GET {url} failed ({error!r}), retrying in {delay}s")
        time.sleep(delay)


class IasoClient(HttpClient):
    """Iaso API Http client."""

    def __init__(self, server_url, retries=RETRIES, backoff_factor=BACKOFF_FACTOR, timeout=TIMEOUT):
        super().__init__(server_url, retries=retries, backoff_factor=backoff_factor, timeout=timeout)
        self.debug = False

    def authenticate_with_username_and_password(self, username, password):
        credentials = {"username": username, "password": password}
        r = self.request("POST", "/api/token/", json=credentials)
        token = r.json().get("access")
        self.authenticate_with_token(token)

    def authenticate_with_token(self, token):
        self.headers["Authorization"] = f"Bearer {token}"

    def post(self, url, json=None, data=None, files=None):
        self.log(url, json)
        resp = self.request("POST", url, json=json, data=data, files=files).json()
        self.log(resp)
        return resp

    def patch(self, url, json=None, data=None, files=None):
        self.log(url, json)
        resp = self.request("PATCH", url, json=json, data=data, files=files).json()
        self.log(resp)
        return resp

    def put(self, url, json=None, data=None, files=None):
        self.log(url, json)
        resp = self.request("PUT", url, json=json, data=data, files=files).json()
        self.log(resp)
        return resp

    def get(self, url, params=None):
        resp = self.get_json(url, params=params)
        self.log(url, resp)
        return resp

    # wait_task_completion, debug and log: possibly dead code copied over from setuper?
    def wait_task_completion(self, task_to_wait):
        logger.info(f"Waiting for async task '{task_to_wait['task']['name']}'")
        count = 0
        imported = False
        while not imported and count < 120:
            task = self.get(f"/api/tasks/{task_to_wait['task']['id']}")
            imported = task["status"] == "SUCCESS"

            if task["status"] == "ERRORED":
                raise Exception(f"Task failed {task}")
            time.sleep(2)
            count += 5
            logger.info(f"Waiting: {count}s elapsed, {task.get('progress_message')}")

    def log(self, arg1, arg2=None):
        if self.debug:
            print(arg1, arg2)

    # Kept for backward compatibility, might also be dead code
    @property
    def server_url(self):
        return self.base_url

    @server_url.setter
    def server_url(self, value):
        self.base_url = value
