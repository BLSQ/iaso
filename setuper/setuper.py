from iaso_api_client import IasoClient
from micro_planning import setup_users_teams_micro_planning
from data_collection import setup_instances
from pyramid import setup_orgunits
from entities import setup_entities
from registry import setup_registry
from default_healthFacility_form import setup_health_facility_level_default_form
from review_change_proposal import setup_review_change_proposal
from create_submission_with_picture import create_submission_with_picture
import string
import random
import argparse

def admin_login(server_url, username, password):
    iaso_admin_client = IasoClient(server_url=server_url)
    iaso_admin_client.authenticate_with_username_and_password(
        username=username,
        password=password,
    )
    return iaso_admin_client

def setup_account(account_name, server_url, username, password):
    data = {
        "account_name": account_name,
        "user_username": account_name,
        "user_first_name": account_name,
        "user_last_name": account_name,
        "password": account_name,
        "modules": ["DEFAULT", "REGISTRY", "PLANNING", "ENTITIES", "DATA_COLLECTION_FORMS"],
    }
    iaso_admin_client = admin_login(server_url, username, password)
    iaso_admin_client.post("/api/setupaccount/", json=data)

    # make sure we use that connection afterwards so we are connected as the account admin and not the ADMIN_USER_NAME
    iaso_client = IasoClient(server_url)
    iaso_client.authenticate_with_username_and_password(
        username=account_name,
        password=account_name,
    )
    return iaso_client

seed_default_health_facility_form = True

seed_instances = True

seed_entities = True

seed_registry = True

seed_review_change_proposal = True

def create_account(server_url, username, password):
    account_name = "".join(random.choices(string.ascii_lowercase, k=7))
    print("Creating account:", account_name)
    iaso_client = setup_account(account_name, server_url, username, password)
    setup_orgunits(iaso_client=iaso_client)

    if seed_default_health_facility_form:
        setup_health_facility_level_default_form(account_name, iaso_client=iaso_client)
        create_submission_with_picture(account_name, iaso_client=iaso_client)

    if seed_registry:
        setup_registry(account_name, iaso_client=iaso_client)

    if seed_instances:
        setup_instances(account_name, iaso_client=iaso_client)
        setup_users_teams_micro_planning(account_name, iaso_client=iaso_client)

    if seed_entities:
        setup_entities(account_name, iaso_client=iaso_client)

    if seed_review_change_proposal:
        setup_review_change_proposal(account_name, iaso_client=iaso_client)

    print("-----------------------------------------------")
    print("Account created:", account_name)
    print("Login at %s with\n\tlogin: %s \n\tpassword: %s" % (server_url, account_name, account_name))
    print("-----------------------------------------------")
    return account_name


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Provide credentials for the setuper")
    parser.add_argument("-u", "--username", type=str, help="User name")
    parser.add_argument("-p", "--password", type=str, help="Password")
    parser.add_argument("-s", "--server_url", type=str, help="Server URL")

    args = parser.parse_args()
    server_url = args.server_url
    username = args.username
    password = args.password

    if server_url is None or username is None or password is None:
        from credentials import *

        server_url = SERVER
        username = ADMIN_USER_NAME
        password = ADMIN_PASSWORD

    create_account(server_url, username, password)