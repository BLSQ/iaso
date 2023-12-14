import requests


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
        resp = r.json()
        try:
            r.raise_for_status()
        except Exception as e:
            print(resp)
            raise e
        self.log(resp)
        return resp

    def get(self, url):
        r = requests.get(self.server_url + url, headers=self.headers)
        payload = r.json()
        self.log(url, payload)
        return payload

    def log(self, arg1, arg2=None):
        if self.debug:
            print(arg1, arg2)
