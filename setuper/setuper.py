from credentials import *
from iaso_api_client import IasoClient
from micro_planning import setup_users_teams_micro_planning
from data_collection import setup_instances
from pyramid import setup_orgunits
from entities import setup_entities
from registry import setup_registry
from default_healthFacility_form import setup_health_facility_level_default_form
from review_change_proposal import setup_review_change_proposal
from create_submission_with_picture import create_submission_with_picture
from additional_projects import create_projects
from constants import DEFAULT_ACCOUNT_NAME
import string
import random
import logging

logger = logging.getLogger(__name__)

iaso_admin_client = IasoClient(server_url=SERVER)
iaso_admin_client.authenticate_with_username_and_password(
    username=ADMIN_USER_NAME,
    password=ADMIN_PASSWORD,
)


def setup_account(account_name):
    data = {
        "account_name": account_name,
        "user_username": account_name,
        "user_first_name": account_name,
        "user_last_name": account_name,
        "password": account_name,
        "modules": ["DEFAULT", "REGISTRY", "PLANNING", "ENTITIES", "DATA_COLLECTION_FORMS"],
    }

    iaso_admin_client.post("/api/setupaccount/", json=data)

    # make sure we use that connection afterwards so we are connected as the account admin and not the ADMIN_USER_NAME
    iaso_client = IasoClient(server_url=SERVER)
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

seed_additionnal_projects = True


if __name__ == "__main__":
    account_name = "".join(random.choices(string.ascii_lowercase, k=7))
    print("Creating account:", account_name)
    iaso_client = setup_account(account_name)
    setup_orgunits(account_name, iaso_client=iaso_client)

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

    if seed_additionnal_projects:
        default_account_name = DEFAULT_ACCOUNT_NAME
        # Setting up the default account if it doesn't exist, otherwise authenticate the user with it
        try:
            iaso_client = setup_account(default_account_name)
        except Exception as e:
            logger.error("Exception " + str(e))  # For logs
            iaso_client = IasoClient(server_url=SERVER)
            iaso_client.authenticate_with_username_and_password(
                username=default_account_name,
                password=default_account_name,
            )
        create_projects(default_account_name, iaso_client=iaso_client)
    print("-----------------------------------------------")
    print("Account created:", account_name)
    print("Login at %s with\n\tlogin: %s \n\tpassword: %s" % (SERVER, account_name, account_name))
    print("-----------------------------------------------")
