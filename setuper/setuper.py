import os


# Get the setuper directory path
SETUPER_DIR = os.path.dirname(os.path.abspath(__file__))
# Change the working directory to the setuper directory
os.chdir(SETUPER_DIR)

import argparse
import random
import re
import string
import sys

from additional_projects import create_projects, link_new_projects_to_main_data_source
from create_submission_with_picture import create_submission_with_picture
from data_collection import setup_instances
from default_healthFacility_form import setup_health_facility_level_default_form
from entities import (
    create_entity_types,
    create_forms_and_entities,
)
from iaso_api_client import IasoClient
from micro_planning import setup_users_teams_micro_planning
from org_unit_pictures import associate_favorite_picture
from pyramid import setup_orgunits
from registry import setup_registry
from review_change_proposal import setup_review_change_proposal
from user_roles_permissions import create_user_role


seed_default_health_facility_form = True

seed_instances = True

seed_entities = True

seed_registry = True

seed_review_change_proposal = True


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
        "modules": [
            "DEFAULT",
            "REGISTRY",
            "PLANNING",
            "ENTITIES",
            "DATA_COLLECTION_FORMS",
            "DHIS2_MAPPING",
            "DATA_VALIDATION",
            "PAYMENTS",
        ],
        "feature_flags": [
            "SHOW_HOME_ONLINE",
            "SHOW_BENEFICIARY_TYPES_IN_LIST_MENU",
            "SHOW_PAGES",
            "SHOW_LINK_INSTANCE_REFERENCE",
            "ALLOW_CATCHMENT_EDITION",
        ],
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


def validate_account_name(name: str) -> str:
    if not name:  # the user didn't pass a name as parameter
        return "".join(random.choices(string.ascii_lowercase, k=7))

    # In all the places where this name is used, the shortest field is the Django User.username (150 chars)
    # However, the setuper can create multiple accounts with a '.xx' suffix, so we need to keep some space
    NAME_MAX_LENGTH = 147
    if len(name) > NAME_MAX_LENGTH:
        raise Exception(f"Account name is too long - {NAME_MAX_LENGTH} characters maximum")

    # I wanted to include "-" in the pattern, but the API converts them to "." and then it breaks stuff later on
    # Not sure how accents in app_id will be handled, so let's avoid them out of caution
    pattern = re.compile("[A-Za-z0-9]+")
    if not pattern.fullmatch(name):
        raise Exception("Account name must be alphanumeric (0-9, a-z, A-Z)")

    return name


def create_account(
    server_url: str,
    username: str,
    password: str,
    optional_account_name: str,
    additional_projects: bool,
):
    account_name = validate_account_name(optional_account_name)
    print("Creating account:", account_name)
    iaso_client = setup_account(account_name, server_url, username, password)
    setup_orgunits(iaso_client=iaso_client)
    create_user_role(iaso_client)

    if seed_default_health_facility_form:
        setup_health_facility_level_default_form(account_name, iaso_client=iaso_client)
        create_submission_with_picture(account_name, iaso_client=iaso_client)

    if seed_registry:
        setup_registry(account_name, iaso_client=iaso_client)

    if seed_instances:
        setup_instances(account_name, iaso_client=iaso_client)
        associate_favorite_picture(iaso_client=iaso_client)

    if seed_entities:
        print("Attempting to create entity")
        create_forms_and_entities(iaso_client=iaso_client)

    if additional_projects:
        create_projects(account_name, iaso_client=iaso_client)
        link_new_projects_to_main_data_source(account_name, iaso_client=iaso_client)
        create_entity_types(iaso_client=iaso_client)
        setup_users_teams_micro_planning(account_name, iaso_client=iaso_client)

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
    parser.add_argument("-n", "--name", help="Account name (max 147 characters; a-z, A-Z, 0-9)")
    parser.add_argument("-a", "--additional_projects", action="store_true")

    args = parser.parse_args()
    server_url = args.server_url
    username = args.username
    password = args.password
    account_name = args.name
    additional_projects = args.additional_projects

    if server_url is None or username is None or password is None:
        from credentials import *

        try:
            server_url = SERVER if server_url is None else server_url
        except ModuleNotFoundError:
            pass
        try:
            password = ADMIN_PASSWORD if (username is None and password is None) else password
        except ModuleNotFoundError:
            pass
        try:
            username = ADMIN_USER_NAME if username is None else username
        except ModuleNotFoundError:
            pass

    if not server_url or not username or not password:
        sys.exit("ERROR: Values for server url, user name and password are all required")

    create_account(server_url, username, password, account_name, additional_projects)
