import base64
import json
import os

import gspread
from oauth2client.service_account import ServiceAccountCredentials

DIRNAME = os.path.dirname(__file__)
SCOPES = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/spreadsheets",
]


def get_client():
    encoded_config = os.environ.get("GOOGLE_API_KEY_BASE64")
    decoded_config = base64.b64decode(encoded_config)
    data = json.loads(decoded_config)
    creds = ServiceAccountCredentials.from_json_keyfile_dict(data, SCOPES)
    return gspread.authorize(creds)
