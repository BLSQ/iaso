from iaso.models.base import ExportLog


class ApiLogger:
    def __init__(self, api):
        self.api = api
        self.export_logs = []

    def get(self, url, params=None):

        response = self.api.get(url, params=params)

        export_log = ExportLog()
        export_log.sent = params
        export_log.received = response.json()
        export_log.url = self.api.base_url + url
        export_log.http_status = 200

        self.export_logs.append(export_log)
        return response

    def post(self, url, payload):

        response = self.api.post(url, payload)

        export_log = ExportLog()
        export_log.sent = payload
        export_log.received = response.json()
        export_log.url = self.api.base_url + url
        export_log.http_status = 200

        self.export_logs.append(export_log)
        return response

    def put(self, url, payload):

        response = self.api.put(url, payload)

        export_log = ExportLog()
        export_log.sent = payload
        export_log.received = response.json()
        export_log.url = self.api.base_url + url
        export_log.http_status = 200

        self.export_logs.append(export_log)
        return response

    def pop_export_logs(self):
        result = self.export_logs
        self.export_logs = []
        return result
