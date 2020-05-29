from lxml import etree


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
