import json

from dhis2 import RequestException

from iaso.models.base import ExportLog


class ApiLogger:
    def __init__(self, api):
        self.api = api
        self.export_logs = []

    def get(self, url, params=None):
        full_url = self.api.base_url + "/" + url
        try:
            response = self.api.get(url, params=params)

            export_log = ExportLog()
            export_log.sent = params
            export_log.received = response.json()
            export_log.url = full_url
            export_log.http_status = 200

            self.export_logs.append(export_log)

        except RequestException as dhis2_exception:
            self.log_exception(dhis2_exception, full_url, params)

        return response

    def post(self, url, payload):
        full_url = self.api.base_url + "/" + url
        try:
            response = self.api.post(url, payload)

            export_log = ExportLog()
            export_log.sent = payload
            export_log.received = response.json()
            export_log.url = full_url
            export_log.http_status = 200

            self.export_logs.append(export_log)

        except RequestException as dhis2_exception:
            self.log_exception(dhis2_exception, full_url, payload)

        return response

    def put(self, url, payload):
        full_url = self.api.base_url + "/" + url

        response = self.api.put(url, payload)
        try:
            export_log = ExportLog()
            export_log.sent = payload
            export_log.received = response.json()
            export_log.url = full_url
            export_log.http_status = 200

        except RequestException as dhis2_exception:
            self.log_exception(dhis2_exception, full_url, payload)

        self.export_logs.append(export_log)
        return response

    def pop_export_logs(self):
        result = self.export_logs
        self.export_logs = []
        return result

    def log_exception(self, dhis2_exception, full_url, params):
        resp = json.loads(dhis2_exception.description)

        export_log = ExportLog()
        export_log.url = full_url
        export_log.sent = params
        export_log.received = resp
        export_log.http_code = dhis2_exception.code
        self.export_logs.append(export_log)
        raise dhis2_exception
