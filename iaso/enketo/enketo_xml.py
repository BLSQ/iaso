import unicodedata

from typing import Tuple

from lxml import etree  # type: ignore
from lxml.etree import XMLParser

from iaso.utils.emoji import fix_emoji


ENKETO_FORM_ID_SEPARATOR = "-"

# parent1_ou_* up to parent9_ou_*
MAX_PARENTS = 9

ORG_UNIT_INJECTABLE_QUESTION_NAMES = [
    "current_ou_id",
    "current_ou_name",
    "current_ou_type_id",
    "current_ou_type_name",
    "current_ou_is_root",
    "current_ou_group_ids",
    "current_ou_group_names",
]

for parent_index in range(1, MAX_PARENTS + 1):
    ORG_UNIT_INJECTABLE_QUESTION_NAMES.append(f"parent{parent_index}_ou_id")
    ORG_UNIT_INJECTABLE_QUESTION_NAMES.append(f"parent{parent_index}_ou_name")
    ORG_UNIT_INJECTABLE_QUESTION_NAMES.append(f"parent{parent_index}_ou_type_id")
    ORG_UNIT_INJECTABLE_QUESTION_NAMES.append(f"parent{parent_index}_ou_type_name")
    ORG_UNIT_INJECTABLE_QUESTION_NAMES.append(f"parent{parent_index}_ou_is_root")
    ORG_UNIT_INJECTABLE_QUESTION_NAMES.append(f"parent{parent_index}_ou_group_ids")
    ORG_UNIT_INJECTABLE_QUESTION_NAMES.append(f"parent{parent_index}_ou_group_names")


def deep_getattr(obj, attr, default=None):
    for part in attr.split("."):
        obj = getattr(obj, part, default)
        if obj is default:
            return default
    return obj


def group_name_token(name):
    # selected() splits on spaces: turn any whitespace (tabs, nbsp, ...) into "_" so each group stays one token,
    # NFC so "é" matches whatever way it was typed, "_" for blank names to keep names aligned with the ids
    return "_".join(unicodedata.normalize("NFC", name or "").split()) or "_"


def group_substitutions(org_unit, prefix, question_names):
    # a query per org unit, only done when the form has the questions
    if f"{prefix}group_ids" not in question_names and f"{prefix}group_names" not in question_names:
        return {}
    # space separated, like a select_multiple answer, so the values can be used with selected() in the form
    groups = list(org_unit.groups.order_by("id").values_list("id", "name"))
    return {
        f".//{prefix}group_ids": " ".join(str(group_id) for group_id, _ in groups),
        f".//{prefix}group_names": " ".join(group_name_token(name) for _, name in groups),
    }


def org_unit_substitutions(org_unit, prefix, question_names):
    substitutions = {}

    # only compute (and query) what the form uses
    def add_if_in_form(question_name, value):
        if question_name in question_names:
            substitutions[f".//{question_name}"] = value()

    add_if_in_form(f"{prefix}id", lambda: org_unit.id)
    add_if_in_form(f"{prefix}name", lambda: org_unit.name)
    add_if_in_form(f"{prefix}type_id", lambda: org_unit.org_unit_type_id or "")
    add_if_in_form(f"{prefix}type_name", lambda: deep_getattr(org_unit, "org_unit_type.name", ""))
    add_if_in_form(f"{prefix}is_root", lambda: "0" if org_unit.parent_id else "1")
    substitutions.update(group_substitutions(org_unit, prefix, question_names))
    return substitutions


def max_parent_index(question_names):
    """The deepest parent the questions use (2 for parent2_ou_name), 0 if none"""
    return max(
        (
            parent_index
            for parent_index in range(1, MAX_PARENTS + 1)
            if any(question_name.startswith(f"parent{parent_index}_ou_") for question_name in question_names)
        ),
        default=0,
    )


def build_substitutions(instance, question_names=ORG_UNIT_INJECTABLE_QUESTION_NAMES):
    substitutions = {}
    if instance and instance.org_unit:
        substitutions = org_unit_substitutions(instance.org_unit, "current_ou_", question_names)

        # walk up the parents only as far as the questions use them
        last_parent_index = max_parent_index(question_names)
        parent = instance.org_unit.parent if last_parent_index else None
        parent_index = 1
        while parent:
            substitutions.update(org_unit_substitutions(parent, f"parent{parent_index}_ou_", question_names))

            parent = parent.parent if parent_index < last_parent_index else None
            parent_index += 1

    return substitutions


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

    for bind in bind_nodes:
        question_name = bind.get("nodeset").split("/")[-1]
        # modify only "injectables" to have the same behavior as an hidden, avoid "calculation" to overwrite the injected values
        if question_name in ORG_UNIT_INJECTABLE_QUESTION_NAMES:
            calculate_expression = bind.get("calculate")
            if calculate_expression:
                # if trivial expression like a constant no reference to another variable or function call
                if "$" not in calculate_expression and "(" not in calculate_expression:
                    # print("deleting ", question_name, bind.get("calculate"))
                    del bind.attrib["calculate"]

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

    # the injectable questions of the form, so only what it uses is queried
    question_names_to_include = [
        question_name
        for question_name in ORG_UNIT_INJECTABLE_QUESTION_NAMES
        if root.xpath(f"boolean(.//*[local-name() = '{question_name}'])")
    ]
    substitutions = build_substitutions(instance, question_names_to_include)

    for xpath, value in substitutions.items():
        node = root.xpath(xpath)
        if node and instance:
            node[0].text = str(value)

    new_xml = etree.tostring(root, encoding="UTF-8", pretty_print=False)

    return instance_uuid, new_xml


def parse_to_structured_dict(instance_xml):
    lxml_parser = XMLParser(huge_tree=True, recover=True)
    xml_str = instance_xml.decode("utf-8")
    root = etree.fromstring(fix_emoji(xml_str), parser=lxml_parser)

    def strip_ns(tag):
        return tag.split("}", 1)[-1] if "}" in tag else tag

    def elem_to_dict(elem):
        node = {}

        # merge attributes
        for k, v in elem.attrib.items():
            node["_" + strip_ns(k)] = v

        # handle children
        children = list(elem)
        if children:
            grouped = {}
            for child in children:
                tag = strip_ns(child.tag)
                grouped.setdefault(tag, []).append(elem_to_dict(child))
            for k, v in grouped.items():
                node[k] = v if len(v) > 1 else v[0]
        else:
            text = (elem.text or "").strip()
            if text:
                return text  # leaf node with text only

        return node

    return {strip_ns(root.tag): elem_to_dict(root)}


def collect_values(data):
    result = []

    def recurse(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if not k.startswith("_"):
                    recurse(v)
        elif isinstance(obj, list):
            for v in obj:
                recurse(v)
        elif isinstance(obj, str):
            result.append(obj)

    recurse(data)
    return result
