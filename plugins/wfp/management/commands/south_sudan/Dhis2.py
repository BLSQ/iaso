import json

from dhis2 import Api, RequestException

from plugins.wfp.models import Dhis2SyncResults


class Dhis2:
    def sync_data(self, external_credential, account, monthly_data):
        api = Api(external_credential.url, external_credential.login, external_credential.password)

        results = []
        for dataValueSet in monthly_data:
            synced_data = Dhis2SyncResults()
            dataSet = {
                "dataSet": dataValueSet["dataSet"],
                "period": dataValueSet["period"],
                "orgUnit": dataValueSet["orgUnit"],
                "dataValues": dataValueSet["dataValues"],
            }
            try:
                response = api.post(
                    "dataValueSets",
                    data=dataSet,
                ).json()

            except RequestException as dhis2_exception:
                response = json.loads(dhis2_exception.description)

            period = dataValueSet["period"]
            synced_data.period = period
            month = period[-2:]
            synced_data.year = period[:4]
            if int(month) < 10:
                month = period[-1:]
            synced_data.month = month
            synced_data.data_set_id = dataValueSet["dataSet"]
            synced_data.org_unit_dhis2_id = dataValueSet["orgUnit"]
            synced_data.org_unit_id = dataValueSet["orgUnitId"]
            synced_data.response = response
            synced_data.status = response.get("status")
            synced_data.json = dataSet

            if response.get("response") is not None:
                synced_data.status = response["response"]["status"]
            synced_data.account = account
            results.append(synced_data)

        return results

    def save_dhis2_sync_results(self, external_credential, account, monthly_data):
        results = self.sync_data(external_credential, account, monthly_data)
        return Dhis2SyncResults.objects.bulk_create(results)
