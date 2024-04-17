import json
import logging
import sys
from json.decoder import JSONDecodeError

import requests
from django.conf import settings as django_settings

logger = logging.getLogger(__name__)

# See iaso/enketo/readme.md


class EnketoError(Exception):
    pass


def enketo_settings():
    return django_settings.ENKETO


def urljoin(arg1, arg2):
    u = "".join([arg1, arg2])
    u = u.replace("//", "/")
    u = u.replace("http:/", "http://")
    u = u.replace("https:/", "https://")
    return u


def enketo_url_for_creation(uuid, server_url, return_url=None):
    """Return Enketo webform URL."""
    settings = enketo_settings()
    url = urljoin(settings["ENKETO_URL"], settings["ENKETO_API_SURVEY_PATH"])
    url = urljoin(url, "/single")
    data = {"server_url": server_url, "form_id": uuid}

    if return_url:
        data["return_url"] = "%s" % return_url

    return get_url_from_enketo(url, data)


def enketo_url_for_edition(form_url, form_id_string, instance_xml=None, instance_id=None, return_url=None, **kwargs):
    """Return Enketo webform URL."""

    settings = enketo_settings()
    url = urljoin(settings["ENKETO_URL"], settings["ENKETO_API_SURVEY_PATH"])
    url = urljoin(url, "/single")
    data = {"form_id": form_id_string, "server_url": form_url}
    if instance_id is not None and instance_xml is not None:
        url = urljoin(settings["ENKETO_URL"], settings["ENKETO_API_INSTANCE_PATH"])
        data.update(
            {
                "instance": instance_xml,
                "instance_id": instance_id,
                # convert to unicode string in python3 compatible way
                "return_url": "%s" % return_url,
            }
        )
    return get_url_from_enketo(url, data)


def get_url_from_enketo(url, data):
    try:
        settings = enketo_settings()

        response = requests.post(url, data=data, auth=(settings["ENKETO_API_TOKEN"], ""), verify=True)
        resp_content = response.content

        resp_content = resp_content.decode("utf-8") if hasattr(resp_content, "decode") else resp_content
        if response.status_code in [200, 201]:
            try:
                data = json.loads(resp_content)
            except ValueError:
                pass
            else:
                url = data.get("edit_url") or data.get("offline_url") or data.get("url") or data.get("single_url")
                if url:
                    if settings.get("ENKETO_DEV"):
                        url = url.replace("enketo:8005", "localhost:8005")
                        return url.replace("https://", "http://")
                    return url

        handle_enketo_error(response)

    except requests.exceptions.ConnectionError as connectionError:
        logger.warning(str(connectionError))
        raise EnketoError("Enketo is not available")


def handle_enketo_error(response):
    """Handle enketo error response."""
    try:
        data = json.loads(response.content)
    except (ValueError, JSONDecodeError):
        print("HTTP Error {}".format(response.status_code), response.text, sys.exc_info())
        if response.status_code == 502:
            raise EnketoError("Sorry, we cannot load your form right now.  Please try " "again later.")
        raise EnketoError()
    else:
        if "message" in data:
            raise EnketoError(data["message"])
        raise EnketoError(response.text)
