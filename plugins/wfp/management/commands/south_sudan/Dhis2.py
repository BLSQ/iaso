import os

import requests

from dhis2 import Api
from requests.auth import HTTPBasicAuth

from plugins.wfp.common import ETL
from plugins.wfp.models import *


class Dhis2:

    def run(self, type):
        entity_type = ETL([type])
        account = entity_type.account_related_to_entity_type()
        print("GOT ACCOUNT ...:", account)
        monthly_data = entity_type.aggregating_data_to_push_to_dhis2(account, "U5")
        #requests.post(DHIS2_URL, json=monthly_data)

        #print("OS ENV ...:", os.environ)

        DHIS2_URL = os.environ.get("DHIS2_URL")
        DHIS2_USER = os.environ.get("DHIS2_USER")
        DHIS2_PASSWORD = os.environ.get("DHIS2_PASSWORD")
        api = Api(DHIS2_URL, DHIS2_USER, DHIS2_PASSWORD)

        results = []
        for row in monthly_data:
            response = api.post(
                "dataValueSets",
                data=row,
            )

            print("RESPONSE ", response.json())
            results.append(response.json())
        
        print("\n\nRESPONSE ", results)
        #return