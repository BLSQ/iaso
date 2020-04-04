import json
import os
import requests
import sys
import zipfile
from builtins import open
from json.decoder import JSONDecodeError
from tempfile import NamedTemporaryFile
from xml.dom import minidom

instance_id = "2fc96b66-9df4-43f4-94db-506ef9775697"


class EnketoError(Exception):
    pass


settings = {
    "ENKETO_API_SALT": "secretsalt",
    "ENKETO_API_TOKEN": "AZE78974654azeAZE",
    "ENKETO_URL": "http://127.0.0.1:81",
    "ENKETO_API_SURVEY_PATH": "/api_v2/survey",
    "ENKETO_API_INSTANCE_PATH": "/api_v2/instance",
    "ENKETO_AUTH_COOKIE": "__enketo",
    "ENKETO_META_UID_COOKIE": "__enketo_meta_uid",
}
settings["ENKETO_PREVIEW_URL"] = "".join(
    [settings["ENKETO_URL"], settings["ENKETO_API_SURVEY_PATH"] + "/preview"]
)
settings["ENKETO_API_INSTANCE_IFRAME_URL"] = (
    settings["ENKETO_URL"] + "api_v2/instance/iframe"
)


def urljoin(arg1, arg2):
    u = "".join([arg1, arg2])
    u = u.replace("//", "/")
    u = u.replace("http:/", "http://")
    u = u.replace("https:/", "https://")
    return u


def enketo_url(
    settings,
    form_url,
    id_string,
    instance_xml=None,
    instance_id=None,
    return_url=None,
    **kwargs
):
    """Return Enketo webform URL."""

    url = urljoin(settings["ENKETO_URL"], settings["ENKETO_API_SURVEY_PATH"])

    values = {"form_id": id_string, "server_url": form_url}
    if instance_id is not None and instance_xml is not None:
        url = urljoin(settings["ENKETO_URL"], settings["ENKETO_API_INSTANCE_PATH"])
        values.update(
            {
                "instance": instance_xml,
                "instance_id": instance_id,
                # convert to unicode string in python3 compatible way
                "return_url": u"%s" % return_url,
            }
        )

    if kwargs:
        # Kwargs need to take note of xform variable paths i.e.
        # kwargs = {'defaults[/widgets/text_widgets/my_string]': "Hey Mark"}
        values.update(kwargs)

    print(url)
    print(values)

    response = requests.post(
        url, data=values, auth=(settings["ENKETO_API_TOKEN"], ""), verify=True
    )
    resp_content = response.content
    print(resp_content)
    resp_content = (
        resp_content.decode("utf-8")
        if hasattr(resp_content, "decode")
        else resp_content
    )
    if response.status_code in [200, 201]:
        try:
            data = json.loads(resp_content)
            print(data)
        except ValueError:
            pass
        else:
            url = data.get("edit_url") or data.get("offline_url") or data.get("url")
            if url:
                return url

    handle_enketo_error(response)


def handle_enketo_error(response):
    """Handle enketo error response."""
    try:
        data = json.loads(response.content)
    except (ValueError, JSONDecodeError):
        print(
            "HTTP Error {}".format(response.status_code), response.text, sys.exc_info()
        )
        if response.status_code == 502:
            raise EnketoError(
                u"Sorry, we cannot load your form right now.  Please try "
                "again later."
            )
        raise EnketoError()
    else:
        if "message" in data:
            raise EnketoError(data["message"])
        raise EnketoError(response.text)


with open("./iaso/api/fixtures/sample-submission.xml") as file:
    instance_xml = file.read()

enketo_url(
    settings,
    "https://f967b309.ngrok.io/api/enketo",
    "qlty_pca_04_partie_financier",
    instance_xml=instance_xml,
    instance_id="2fc96b66-9df4-43f4-94db-506ef9775697",  # None,
    return_url="https://iaso.bluesquare.org",
)
