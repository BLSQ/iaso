from typing import Tuple

from lxml import etree  # type: ignore
from lxml.etree import XMLParser

from iaso.utils.emoji import fix_emoji


ENKETO_FORM_ID_SEPARATOR = "-"

ORG_UNIT_INJECTABLE_QUESTION_NAMES = [
    "current_ou_id",
    "current_ou_name",
    "current_ou_type_id",
    "current_ou_type_name",
    "parent1_ou_id",
    "parent1_ou_name",
    "parent1_ou_type_id",
    "parent1_ou_type_name",
    "parent1_ou_is_root",
    "parent2_ou_id",
    "parent2_ou_name",
    "parent2_ou_type_id",
    "parent2_ou_type_name",
    "parent2_ou_is_root",
    "parent3_ou_id",
    "parent3_ou_name",
    "parent3_ou_type_id",
    "parent3_ou_type_name",
    "parent3_ou_is_root",
    "parent4_ou_id",
    "parent4_ou_name",
    "parent4_ou_type_id",
    "parent4_ou_type_name",
    "parent4_ou_is_root",
    "parent5_ou_id",
    "parent5_ou_name",
    "parent5_ou_type_id",
    "parent5_ou_type_name",
    "parent5_ou_is_root",
    "parent6_ou_id",
    "parent6_ou_name",
    "parent6_ou_type_id",
    "parent6_ou_type_name",
    "parent6_ou_is_root",
    "parent7_ou_id",
    "parent7_ou_name",
    "parent7_ou_type_id",
    "parent7_ou_type_name",
    "parent7_ou_is_root",
]


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

    # Get the default namespace
    default_ns = root.nsmap[None]  # None gives the default namespace URI

    # Find all <bind> nodes in the default namespace
    bind_nodes = root.findall(f".//{{{default_ns}}}bind")

    print("**************************** ")
    print("removing calculate")
    print("    Iterate over bind nodes")
    print("**************************** ")
    for bind in bind_nodes:
        question_name = bind.get("nodeset").split("/")[-1]
        print(" bind : ", bind.get("nodeset"))
        calculate_expression = bind.get("calculate")
        if calculate_expression:
            # if trivial expression like a constant no reference to another variable or function call
            if "$" not in calculate_expression and "(" not in calculate_expression:
                print("deleting ", bind.get("calculate"))
                del bind.attrib["calculate"]

    instance_xml = etree.tostring(root, pretty_print=False, encoding="UTF-8")
    print(instance_xml.decode("utf-8"))
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


def extract_xml_instance_from_form_xml(form_version_xml, instance_uuid):
    lxml_parser = XMLParser(huge_tree=True, recover=True)
    xml_str = form_version_xml.decode("utf-8")

    root = etree.fromstring(fix_emoji(xml_str), parser=lxml_parser)
    # Get the default namespace URI
    default_ns_uri = root.nsmap.get(None)

    # Use the default namespace in XPath
    if default_ns_uri:
        namespaces = {"d": default_ns_uri}  # Assign 'd' as a prefix
        data_node = root.xpath(".//d:data", namespaces=namespaces)
    else:
        data_node = root.xpath(".//data")  # No default namespace

    data_node = data_node[0]

    # make a copy the data_node and adjust namespaces

    new_nsmap = {"jr": "http://openrosa.org/javarosa", "orx": "http://openrosa.org/xforms"}

    new_data_node = etree.Element("data", nsmap=new_nsmap)

    new_data_node.attrib.update(data_node.attrib)

    for child in data_node:
        # Remove the namespace from each tag (strip namespace)
        child.tag = etree.QName(child).localname
        for subchild in child.iterdescendants():
            subchild.tag = etree.QName(subchild).localname
        new_data_node.append(child)

    # Create <meta> and <instanceID> nodes
    instance_id_tag = new_data_node.find(".//meta/instanceID")
    instance_id_tag.text = f"uuid:{instance_uuid}"

    print(etree.tostring(new_data_node, encoding="UTF-8", pretty_print=True).decode())
    instance_xml = etree.tostring(new_data_node, encoding="UTF-8", pretty_print=False)
    return instance_xml


# we still use lxml.etree and not xml.etree because the latter seems to drop the namespace attribute by default
def inject_xml_find_uuid(instance_xml, instance_id, version_id, user_id, instance=None) -> Tuple[str, bytes]:
    """ "Inject the attribute in different place in the xml
    Return the uuid found in the xml
    """
    # use custom parser to match the recover flag as in beautifulsoup while flattening
    lxml_parser = XMLParser(huge_tree=True, recover=True)
    xml_str = instance_xml.decode("utf-8")
    #  Get the instanceID (uuid) from the //meta/instanceID
    #  We have an uuid on instance. but it seems not always filled?
    root = etree.fromstring(fix_emoji(xml_str), parser=lxml_parser)
    instance_id_tag = root.find(".//meta/instanceID")

    instance_uuid = instance_id_tag.text.replace("uuid:", "")  # type: ignore

    root.attrib["version"] = str(version_id)
    root.attrib["iasoInstance"] = str(instance_id)
    # inject the editUserID in the meta of the xml to allow attributing Modification to the user
    edit_user_id_tag = root.find(".//meta/editUserID")
    if edit_user_id_tag is None:
        edit_user_id_tag = etree.SubElement(root.find(".//meta"), "editUserID")  # type: ignore
    edit_user_id_tag.text = str(user_id)

    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! INJECT ")
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! INJECT ")
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! INJECT ")
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! INJECT ")
    substitutions = {
        ".//current_ou_id": instance.org_unit.id,
        ".//current_ou_name": instance.org_unit.name,
        ".//current_ou_type_id": instance.org_unit.org_unit_type.id,
        ".//current_ou_type_name": instance.org_unit.org_unit_type.name,
    }

    ancestors = []
    parent = instance.org_unit.parent
    while parent:
        ancestors.append(parent)
        parent = parent.parent
    ancestors.reverse()
    ancestor_index = 1
    for ancestor in ancestors:
        prefix = f"parent{ancestor_index}_ou_"
        substitutions[f".//{prefix}id"] = ancestor.id
        substitutions[f".//{prefix}name"] = ancestor.name
        substitutions[f".//{prefix}type_id"] = ancestor.org_unit_type.id
        substitutions[f".//{prefix}type_name"] = ancestor.org_unit_type.name
        substitutions[f".//{prefix}is_root"] = "1" if ancestor_index == 1 else "0"
        ancestor_index += 1

    for xpath, value in substitutions.items():
        node = root.xpath(xpath)
        if node and instance:
            print("injecting ", xpath, value)
            node[0].text = str(value)

    new_xml = etree.tostring(root, encoding="UTF-8", pretty_print=False)

    print(new_xml)

    return instance_uuid, new_xml
