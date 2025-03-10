import time

import requests


class IasoClient:
    ASYNC_TASK_TIMEOUT = 120
    ASYNC_TASK_WAIT_STEP = 5

    def __init__(self, server_url):
        self.debug = False
        self.server_url = server_url
        self.headers = {}

    def authenticate_with_username_and_password(self, username, password):
        credentials = {"username": username, "password": password}
        r = requests.post(self.server_url + "/api/token/", json=credentials)
        token = r.json().get("access")
        self.authenticate_with_token(token)

    def authenticate_with_token(self, token):
        self.headers["Authorization"] = "Bearer %s" % token

    def post(self, url, json=None, data=None, files=None):
        self.log(url, json)
        r = requests.post(self.server_url + url, json=json, data=data, headers=self.headers, files=files)
        resp = None
        try:
            resp = r.json()
            r.raise_for_status()
        except Exception as e:
            print(resp, r)
            raise e
        self.log(resp)
        return resp

    def patch(self, url, json=None, data=None, files=None):
        self.log(url, json)
        print(url, json)
        r = requests.patch(self.server_url + url, json=json, data=data, headers=self.headers, files=files)
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
        r = requests.put(self.server_url + url, json=json, data=data, headers=self.headers, files=files)
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
        r = requests.get(self.server_url + url, params=params, headers=self.headers)
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
