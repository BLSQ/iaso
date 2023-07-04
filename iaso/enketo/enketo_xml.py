from typing import Tuple

from lxml import etree  # type: ignore

ENKETO_FORM_ID_SEPARATOR = "-"


def inject_instance_id_in_form(xml_str, instance_id):
    root = etree.fromstring(xml_str)
    root.set("iasoInstance", str(instance_id))

    head = root[0]
    model = [c for c in head if c.tag == "{http://www.w3.org/2002/xforms}model"][0]
    instance = [c for c in model if c.tag == "{http://www.w3.org/2002/xforms}instance"][0]
    data = [c for c in instance if c.tag == "{http://www.w3.org/2002/xforms}data"][0]

    instance_id_tags = [c for c in data if c.tag == "iasoInstanceId"]
    if len(instance_id_tags) > 0:
        instance_id_tags[0].text = str(instance_id)
    else:
        instance_id_tag = etree.Element("iasoInstanceId")
        instance_id_tag.text = str(instance_id)
        data.set("iasoInstance", str(instance_id))
    instance_xml = etree.tostring(root, pretty_print=False, encoding="UTF-8")
    return instance_xml.decode("utf-8")


def to_xforms_xml(form, download_url, manifest_url, version, md5checksum, new_form_id=None):
    # create XML
    ns = {"xmlns": "http://openrosa.org/xforms/xformsList"}
    root = etree.Element("xforms", ns)

    xform = etree.Element("xform")
    root.append(xform)
    form_id = etree.Element("formID")
    if new_form_id is not None:
        form_id.text = new_form_id
    else:
        form_id.text = (
            form.form_id
            + ENKETO_FORM_ID_SEPARATOR
            + str(form.id)
            + ENKETO_FORM_ID_SEPARATOR
            + str(form.latest_version.version_id)
        )

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

    if manifest_url:
        form_url = etree.Element("manifestUrl")
        form_url.text = manifest_url
        xform.append(form_url)

    xforms_xml = etree.tostring(root, pretty_print=False, encoding="UTF-8")
    return xforms_xml.decode("utf-8")


# we still use lxml.etree and not xml.etree because the latter seems to drop the namespace attribute by default
def inject_xml_find_uuid(instance_xml, instance_id, version_id, user_id) -> Tuple[str, bytes]:
    """ "Inject the attribute in different place in the xml
    Return the uuid found in the xml
    """
    xml_str = instance_xml.decode("utf-8")
    #  Get the instanceID (uuid) from the //meta/instanceID
    #  We have an uuid on instance. but it seems not always filled?
    root = etree.fromstring(xml_str)
    instance_id_tag = root.find(".//meta/instanceID")
    instance_uuid = instance_id_tag.text.replace("uuid:", "")  # type: ignore

    root.attrib["version"] = str(version_id)
    root.attrib["iasoInstance"] = str(instance_id)
    # inject the editUserID in the meta of the xml to allow attributing Modification to the user
    edit_user_id_tag = root.find(".//meta/editUserID")
    if edit_user_id_tag is None:
        edit_user_id_tag = etree.SubElement(root.find(".//meta"), "editUserID")  # type: ignore
    edit_user_id_tag.text = str(user_id)
    new_xml = etree.tostring(root, encoding="UTF-8", pretty_print=False)
    return instance_uuid, new_xml
