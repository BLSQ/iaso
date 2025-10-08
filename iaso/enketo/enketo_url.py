import json
import logging
import sys
import time

from json.decoder import JSONDecodeError
from urllib.parse import urlencode

import requests

from django.conf import settings as django_settings
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner

from iaso.api.query_params import ENKETO_EXPIRES, ENKETO_SIGNED


logger = logging.getLogger(__name__)

# See iaso/enketo/readme.md


class EnketoError(Exception):
    pass


def enketo_settings(specific_env: str = None):
    if specific_env:
        return django_settings.ENKETO.get(specific_env, None)
    return django_settings.ENKETO


def urljoin(arg1, arg2):
    u = "".join([arg1, arg2])
    u = u.replace("//", "/")
    u = u.replace("http:/", "http://")
    u = u.replace("https:/", "https://")
    return u


def enketo_url_for_edition(
    form_url,
    form_id_string,
    instance_xml=None,
    instance_id=None,
    return_url=None,
    instance=None,
    generate_url_for_enketo=None,
    **kwargs,
):
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

        if instance and generate_url_for_enketo:
            for instance_file in instance.instancefile_set(manager="objects_with_file_extensions").all():
                # the "notation" isn't as in json
                #    like {'instance_attachments':{ "image-10_43_8.png": 'https://...image-10_43_8.png'}}
                # posting form data it's
                #   'instance_attachments[image-10_43_8.png]': 'https://...image-10_43_8.png'
                # just don't know what will happen if there's a [ or ] in the file name

                path = "/api/enketo/instance_files/{instance_file.id}/{file.name}"
                data[f"instance_attachments[{instance_file.name}]"] = generate_url_for_enketo(instance_file.file.url)
    print(data)
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
        print(f"HTTP Error {response.status_code}", response.text, sys.exc_info())
        if response.status_code == 502:
            raise EnketoError("Sorry, we cannot load your form right now.  Please try again later.")
        raise EnketoError()
    else:
        if "message" in data:
            raise EnketoError(data["message"])
        raise EnketoError(response.text)


def generate_signed_url(path: str, secret: str, expiry_seconds=300, extra_params: dict = {}) -> str:
    signer = TimestampSigner(secret)
    signed_path = signer.sign(path)
    expires = int(time.time()) + expiry_seconds
    params = urlencode({**extra_params, "expires": expires, "signed": signed_path})
    return f"{path}?{params}"


def verify_signed_url(request, secret: str) -> bool:
    path = request.path
    signed = request.query_params.get(ENKETO_SIGNED, None)
    expires = request.query_params.get(ENKETO_EXPIRES, None)

    if not signed or not expires:
        return False

    if int(expires) < int(time.time()):
        return False

    signer = TimestampSigner(secret)
    try:
        original = signer.unsign(signed)
        return original == path
    except (BadSignature, SignatureExpired):
        return False
