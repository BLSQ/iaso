import json

from dhis2 import Api, RequestException

from plugins.wfp.common import ETL
from plugins.wfp.models import *


class Dhis2:
    def sync_data(self, type, external_credential):
        entity_type = ETL([type])
        account = entity_type.account_related_to_entity_type()
        monthly_data = entity_type.aggregating_data_to_push_to_dhis2(account)
        api = Api(external_credential.url, external_credential.login, external_credential.password)

        results = []
        for dataValueSet in monthly_data:
            synced_data = Dhis2SyncResults()
            try:
                response = api.post(
                    "dataValueSets",
                    data={
                        "dataSet": dataValueSet["dataSet"],
                        "period": dataValueSet["period"],
                        "orgUnit": dataValueSet["orgUnit"],
                        "dataValues": dataValueSet["dataValues"],
                    },
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
            if response.get("response") is not None:
                synced_data.status = response["response"]["status"]
            synced_data.account = account
            results.append(synced_data)

        return results

    def save_dhis2_sync_results(self, type, external_credential):
        results = self.sync_data(type, external_credential)
        return Dhis2SyncResults.objects.bulk_create(results)
