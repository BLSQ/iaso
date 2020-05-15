import json
import os
import sys
import requests

from builtins import open
from json.decoder import JSONDecodeError
from xml.dom import minidom


class EnketoError(Exception):
    pass


def enketo_settings():
    settings = {
        "ENKETO_DEV": "local",
        "ENKETO_API_SALT": "secretsalt",
        "ENKETO_API_TOKEN": "AZE78974654azeAZE",
        "ENKETO_URL": "http://192.168.1.15:81",  # move the settings and find a way to the "host ip"
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

    return settings


def urljoin(arg1, arg2):
    u = "".join([arg1, arg2])
    u = u.replace("//", "/")
    u = u.replace("http:/", "http://")
    u = u.replace("https:/", "https://")
    return u


def enketo_url(
    settings,
    form_url,
    form_id_string,
    instance_xml=None,
    instance_id=None,
    return_url=None,
    **kwargs
):
    """Return Enketo webform URL."""

    url = urljoin(settings["ENKETO_URL"], settings["ENKETO_API_SURVEY_PATH"])

    values = {"form_id": form_id_string, "server_url": form_url}
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

    response = requests.post(
        url, data=values, auth=(settings["ENKETO_API_TOKEN"], ""), verify=True
    )
    resp_content = response.content

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
                if settings.get("ENKETO_DEV"):
                    return url.replace("https://", "http://")
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
