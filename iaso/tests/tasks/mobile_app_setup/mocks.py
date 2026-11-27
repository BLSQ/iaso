"""Test doubles shared by the mobile app setup tests."""

SERVER = "https://iaso.test"
S3 = "https://bucket.s3.amazonaws.com"


class FakeClient:
    def __init__(self, responses=None, files=None):
        self.responses = responses or {}
        self.files = files or {}
        self.requests = []
        self.token = None

    def get_bytes(self, url):
        return self.files[url]

    def get_json(self, path, params=None):
        self.requests.append((path, dict(params or {})))
        response = self.responses[path]
        if isinstance(response, list) and params and "page" in params:
            return response[params["page"] - 1]
        return response

    def authenticate_with_token(self, token):
        self.token = token


class FakeStorage:
    def __init__(self, files=None):
        self.files = files or {}

    def get_bytes(self, url):
        return self.files[url]
