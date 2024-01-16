import requests
import time


class IasoClient:
    def __init__(self, server_url, user_name, password):
        self.debug = False
        self.user_name = user_name
        self.password = password
        self.server_url = server_url
        self.headers = self.init_auth_headers()

    def get_api_url(self):
        return self.server_url + "/api/"

    def init_auth_headers(self):
        creds = {"username": self.user_name, "password": self.password}

        r = requests.post(self.get_api_url() + "token/", json=creds)

        token = r.json().get("access")
        headers = {"Authorization": "Bearer %s" % token}
        return headers

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
        payload = r.json()
        self.log(url, payload)
        return payload

    def wait_task_completion(self, task_to_wait):
        print(f"\tWaiting for async task '{task_to_wait['task']['name']}'")
        count = 0
        imported = False
        while not imported and count < 120:
            task = self.get(f"/api/tasks/{task_to_wait['task']['id']}")
            imported = task["status"] == "SUCCESS"

            if task["status"] == "ERRORED":
                raise Exception(f"Task failed {task}")
            time.sleep(2)
            count += 5
            print("\t\tWaiting:", count, "s elapsed", task.get("progress_message"))

    def log(self, arg1, arg2=None):
        if self.debug:
            print(arg1, arg2)
