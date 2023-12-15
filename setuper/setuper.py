from credentials import *
from client import IasoClient
from micro_planning import setup_users_teams_micro_planning
from data_collection import setup_instances
from pyramid import setup_orgunits
from entities import setup_entities
import string
import random

iaso_client = IasoClient(SERVER, ADMIN_USER_NAME, ADMIN_PASSWORD)


def setup_account(account_name):
    data = {
        "account_name": account_name,
        "user_username": account_name,
        "user_first_name": account_name,
        "user_last_name": account_name,
        "password": account_name,
        "modules": ["DEFAULT", "REGISTRY", "PLANNING", "ENTITIES", "DATA_COLLECTION_FORMS"],
    }

    iaso_client.post("/api/setupaccount/", json=data)

    # make sure we use that connection afterwards so we are connected as the account admin and not the ADMIN_USER_NAME
    return IasoClient(server_url=SERVER, user_name=account_name, password=account_name)


if __name__ == "__main__":
    account_name = "".join(random.choices(string.ascii_lowercase, k=7))
    print("Creating account:", account_name)
    iaso_client = setup_account(account_name)
    setup_orgunits(account_name, iaso_client=iaso_client)
    setup_entities(account_name, iaso_client=iaso_client)

    # setup_instances(account_name, iaso_client=iaso_client)
    # setup_users_teams_micro_planning(account_name, iaso_client=iaso_client)

    print("-----------------------------------------------")
    print("Account created:", account_name)
    print("Login at %s with\n\tlogin: %s \n\tpassword: %s" % (SERVER, account_name, account_name))
    print("-----------------------------------------------")
