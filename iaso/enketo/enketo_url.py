import os
import sys
import requests
import json
from json.decoder import JSONDecodeError
from lxml import etree

# See REVERSE-ENKETO.md for more info


class EnketoError(Exception):
    pass


def enketo_settings():
    settings = {
        "ENKETO_DEV": os.environ.get("ENKETO_DEV"),
        "ENKETO_API_TOKEN": os.environ.get("ENKETO_API_TOKEN"),
        "ENKETO_URL": os.environ.get("ENKETO_URL"),
        "ENKETO_API_SURVEY_PATH": "/api_v2/survey",
        "ENKETO_API_INSTANCE_PATH": "/api_v2/instance",
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


def inject_userid(xml_str, userId):
    root = etree.fromstring(xml_str)

    meta_tag = [c for c in root if c.tag == "meta"][0]

    edit_user_id_tags = [c for c in meta_tag if c.tag == "editUserID"]
    if len(edit_user_id_tags) > 0:
        edit_user_id_tags[0].text = str(userId)
    else:
        edit_user_id_tag = etree.Element("editUserID")
        edit_user_id_tag.text = str(userId)
        meta_tag.append(edit_user_id_tag)

    instance_xml = etree.tostring(root, pretty_print=False, encoding="UTF-8")
    return instance_xml.decode("utf-8")


def to_xforms_xml(form, download_url, version, md5checksum):
    # create XML
    ns = {"xmlns": "http://openrosa.org/xforms/xformsList"}
    root = etree.Element("xforms", ns)

    xform = etree.Element("xform")
    root.append(xform)

    form_id = etree.Element("formID")
    form_id.text = form.form_id
    xform.append(form_id)

    form_name = etree.Element("name")
    form_name.text = form.name
    xform.append(form_name)

    form_version = etree.Element("version")
    form_version.text = version
    xform.append(form_version)

    form_hash = etree.Element("hash")
    form_hash.text = "md5:" + md5checksum
    xform.append(form_hash)

    form_description = etree.Element("descriptionText")
    form_description.text = form.name
    xform.append(form_description)

    form_url = etree.Element("downloadUrl")
    form_url.text = download_url
    xform.append(form_url)

    xforms_xml = etree.tostring(root, pretty_print=False, encoding="UTF-8")
    return xforms_xml.decode("utf-8")
