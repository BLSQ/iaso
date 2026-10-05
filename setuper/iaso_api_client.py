import time

from datetime import datetime

import requests


class IasoClient:
    ASYNC_TASK_TIMEOUT = 120
    ASYNC_TASK_WAIT_STEP = 5

    def __init__(self, server_url):
        self.debug = False
        self.verbose = False
        self.server_url = server_url
        self.headers = {}

    def request(self, method, url, params=None, **kwargs):
        """Send an authenticated request to the server, logging it (url + params) when verbose is on."""
        full_url = self.server_url.rstrip("/") + "/" + url.lstrip("/")
        if self.verbose:
            print(f"[{datetime.now().isoformat(timespec='milliseconds')}] {method} {full_url} params={params}")
        start = time.monotonic()
        r = requests.request(method, full_url, params=params, headers=self.headers, **kwargs)
        if self.verbose:
            print(
                f"[{datetime.now().isoformat(timespec='milliseconds')}] <- {r.status_code} in {time.monotonic() - start:.2f}s"
            )
        return r

    def authenticate_with_username_and_password(self, username, password):
        credentials = {"username": username, "password": password}
        r = self.request("POST", "/api/token/", json=credentials)
        token = r.json().get("access")
        self.authenticate_with_token(token)

    def authenticate_with_token(self, token):
        self.headers["Authorization"] = "Bearer %s" % token

    def post(self, url, json=None, params=None, data=None, files=None):
        self.log(url, json)
        r = self.request("POST", url, json=json, params=params, data=data, files=files)
        resp = None
        try:
            resp = r.json()
            r.raise_for_status()
        except Exception as e:
            print(resp, r)
            raise e
        self.log(resp)
        return resp

    def patch(self, url, json=None, params=None, data=None, files=None):
        self.log(url, json)
        print(url, json)
        r = self.request("PATCH", url, json=json, params=params, data=data, files=files)
        resp = None
        try:
            resp = r.json()
            r.raise_for_status()
        except Exception as e:
            print(resp, r)
            raise e
        self.log(resp)
        return resp

    def put(self, url, json=None, data=None, files=None):
        self.log(url, json)
        print(url, json)
        r = self.request("PUT", url, json=json, data=data, files=files)
        resp = None
        try:
            resp = r.json()
            r.raise_for_status()
        except Exception as e:
            print(resp, r)
            raise e
        self.log(resp)
        return resp

    def get(self, url, params=None):
        r = self.request("GET", url, params=params)
        resp = None
        try:
            resp = r.json()
            r.raise_for_status()
        except Exception as e:
            print(resp, r)
            raise e
        self.log(url, resp)
        return resp

    def wait_task_completion(self, task_to_wait):
        print(f"\tWaiting for async task '{task_to_wait['task']['name']}'")
        count = 0
        imported = False
        while not imported and count < self.ASYNC_TASK_TIMEOUT:
            task = self.get(f"/api/tasks/{task_to_wait['task']['id']}")
            imported = task["status"] == "SUCCESS"

            if task["status"] == "ERRORED":
                raise Exception(f"Task failed {task}")
            time.sleep(self.ASYNC_TASK_WAIT_STEP)
            count += self.ASYNC_TASK_WAIT_STEP
            print("\t\tWaiting:", count, "s elapsed", task.get("progress_message"))

        if not imported:
            raise Exception(
                f"Couldn't find an available worker after {self.ASYNC_TASK_TIMEOUT} seconds. Please make sure a worker is running."
            )

    def log(self, arg1, arg2=None):
        if self.debug:
            print(arg1, arg2)
