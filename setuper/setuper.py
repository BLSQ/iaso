import requests
from credentials import *


def get_auth_headers(user_name, password):
    server = "https://iaso.bluesquare.org"
    creds = {
        "username": user_name,
        "password": password
    }

    # get API token
    r = requests.post(server + "/api/token/", json=creds)

    token = r.json().get('access')
    headers = {"Authorization": "Bearer %s" % token}
    return headers


def setup_account(account_name):
    headers = get_auth_headers(ADMIN_USER_NAME, ADMIN_PASSWORD)
    setup_account_url = f"{API_URL}setupaccount/"

    data = {
        "account_name": account_name,
        "user_username": account_name,
        "user_first_name": account_name,
        "user_last_name": account_name,
        "password": account_name
    }

    r = requests.post(setup_account_url, json=data, headers=headers)
    print(r, r.json())

if __name__ == '__main__':
    import string
    import random
    account_name = ''.join(random.choices(string.ascii_lowercase + string.digits, k=5))
    print("account created:", account_name)
    setup_account(account_name)