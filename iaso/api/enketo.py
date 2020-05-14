import json
import os
import sys
import zipfile
from builtins import open
from json.decoder import JSONDecodeError
from tempfile import NamedTemporaryFile
from xml.dom import minidom

import requests
from bs4 import BeautifulSoup as Soup
from django.http import HttpResponse, JsonResponse
from rest_framework import status, viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from iaso.models import DataSource, Form, Instance, InstanceFile, OrgUnit

from .auth.authentication import CsrfExemptSessionAuthentication


import hashlib


DEFAULT_CHUNK_SIZE = 64 * 2 ** 10


def calculate_file_md5(file_):
    if not file_:
        return ""
    md5 = hashlib.md5()
    for chunk in file_.chunks():
        md5.update(chunk)
    return md5.hexdigest()


def calculate_data_md5(data, chunk_size=None):
    if not data:
        return ""
    if not chunk_size:
        chunk_size = DEFAULT_CHUNK_SIZE
    md5 = hashlib.md5()
    idx = 0
    while True:
        chunk = data[idx : idx + chunk_size]
        if not chunk:
            break
        md5.update(chunk)
        idx = idx + chunk_size
    return md5.hexdigest()


def calculate_md5(file_=None, data=None, chunk_size=None):
    if file_:
        return calculate_file_md5(file_)
    return calculate_data_md5(data, chunk_size=chunk_size)


class EnketoError(Exception):
    pass


settings = {
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


class EnketoViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = (CsrfExemptSessionAuthentication,)
    permission_classes = []

    def edit_in_enketo(self, request, instance_id):

        instance = Instance.objects.filter(id=instance_id).first()

        instance_xml = instance.file.read()
        print(instance_xml)
        print("db uuid", instance.uuid)
        print("EDITING ", instance.form.form_id, instance.json["instanceID"])
        edit_url = enketo_url(
            settings,
            "http://docker-host:8081/api/enketo",
            form_id_string=instance.form.form_id,
            instance_xml=instance_xml,
            instance_id=instance.json["instanceID"],  # None,
            return_url=request.GET.get(
                "return_url",
                "http://127.0.0.1:8081/dashboard/instance/instanceId/"
                + str(instance_id)
                + "&debug"
                + instance.json["instanceID"],
            ),
        )

        return JsonResponse({"edit_url": edit_url}, status=201)

    def list(self, request):
        print("Enketo !")
        print(self.request.GET)
        print(self.request.POST)
        form = Form.objects.filter(form_id=request.GET["formID"]).first()
        lastest_form_version = form.latest_version

        downloadurl = "http://docker-host:8081" + lastest_form_version.file.url
        content = [
            '<xforms xmlns="http://openrosa.org/xforms/xformsList">',
            "<xform>",
            "<formID>",
            form.form_id,
            "</formID>",
            "<name>",
            form.name,
            "</name>",
            "<version>" + lastest_form_version.version_id + "</version>",
            "<hash>md5:" + calculate_md5(lastest_form_version.file) + "</hash>",
            "<descriptionText>",
            form.name,
            "</descriptionText>",
            "<downloadUrl>",
            downloadurl,
            "</downloadUrl>",
            "</xform>",
            "</xforms>",
        ]

        print(("").join(content))

        return HttpResponse(("").join(content), content_type="application/xml")

    def post(self, request):
        print("Enketo ! POST")
        print(self.request.GET)
        print(self.request.POST)
        import pdb

        pdb.set_trace()

        return HttpResponse(
            open(
                os.path.join(os.path.dirname(__file__), "./fixtures/xforms.xml"),
                "r",
                encoding="utf-8",
            ).read(),
            content_type="application/xml",
        )

    def getsubmission(self, request):
        if request.method.upper() == "HEAD":
            resp = HttpResponse("", status=status.HTTP_204_NO_CONTENT)
            resp["x-openrosa-accept-content-length"] = 100000000
            return resp

        print("Enketo !", "getsubmission")
        if request.FILES:
            # TODO version ?
            # versioning of changes
            # can we prevent "media files re upload ?"
            main_file = request.FILES["xml_submission_file"]

            soup = Soup(main_file.read(), "xml")
            print(soup)
            form_id = [c for c in soup.children][0].attrs["id"]
            instanceid = soup.meta.deprecatedID.contents[0].strip()
            print("UPDATING ", form_id, instanceid)

            i = Instance.objects.filter(json__instanceID=instanceid).first()
            i.file = request.FILES["xml_submission_file"]
            i.json = {}
            i.save()

            try:
                i.get_and_save_json_of_xml()
                try:
                    i.convert_location_from_field()
                    i.convert_device()
                except ValueError as error:
                    print(error)
            except:
                pass

            for file_name in request.FILES:
                if file_name != "xml_submission_file":
                    fi = InstanceFile()
                    fi.file = request.FILES[file_name]
                    fi.instance_id = i.id
                    fi.name = file_name
                    fi.save()

            return JsonResponse({"result": "success"}, status=201)
        print(self.request.GET)
        print(self.request.POST)
        return HttpResponse(
            open(
                os.path.join(os.path.dirname(__file__), "./fixtures/sample-form.xml"),
                "r",
                encoding="utf-8",
            ).read(),
            content_type="application/xml",
        )
