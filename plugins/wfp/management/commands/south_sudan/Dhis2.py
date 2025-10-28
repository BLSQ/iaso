import json
import os

from dhis2 import Api, RequestException

from plugins.wfp.common import ETL
from plugins.wfp.models import *


class Dhis2:
    def sync_data(self, type):
        entity_type = ETL([type])
        account = entity_type.account_related_to_entity_type()
        monthly_data = entity_type.aggregating_data_to_push_to_dhis2(account, "U5")

        DHIS2_URL = os.environ.get("DHIS2_URL")
        DHIS2_USER = os.environ.get("DHIS2_USER")
        DHIS2_PASSWORD = os.environ.get("DHIS2_PASSWORD")
        api = Api(DHIS2_URL, DHIS2_USER, DHIS2_PASSWORD)

        dataValueSets = map(
            lambda row: {
                "dataSet": row["dataSet"],
                "period": row["period"],
                "orgUnit": row["orgUnit"],
                "dataValues": row["dataValues"],
            },
            monthly_data,
        )
        results = []
        for dataValueSet in dataValueSets:
            synced_data = Dhis2SyncResults()
            try:
                response = api.post("dataValueSets", data=dataValueSet).json()
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
            synced_data.response = response
            synced_data.status = response["response"]["status"]
            synced_data.account = account
            synced_data.programme_type = "U5"
            results.append(synced_data)

        return results

    def save_dhis2_sync_results(self, type):
        results = self.sync_data(type)
        return Dhis2SyncResults.objects.bulk_create(results)
