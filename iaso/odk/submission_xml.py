"""Changes to a submission's XML that odk_cli `edit` doesn't make itself, done before it runs: it then loads the result
as the submission and computes again what depends on it."""

from lxml import etree  # type: ignore
from lxml.etree import XMLParser

from iaso.utils.emoji import fix_emoji


XFORMS = "http://www.w3.org/2002/xforms"
JR_TEMPLATE = "{http://openrosa.org/javarosa}template"


class NoSuchElement(ValueError):
    pass


def remove_repeat_instances(xml: bytes, paths: list[str]) -> bytes:
    """`paths`: below the root, every repeat indexed from 1 (`child[2]`, `household/child[1]/toy[3]`), `[*]` last for
    every instance. All are found before any is removed: each index is one of the submission as it is.

    Raises `NoSuchElement` with the path naming nothing."""
    root = _parse(xml)
    found = []
    for path in paths:
        elements = _find(root, path)
        if not elements and not path.endswith("[*]"):
            raise NoSuchElement(path)
        found += elements
    for element in found:
        element.getparent().remove(element)
    return etree.tostring(root, encoding="UTF-8", xml_declaration=False)


def move_to_version(xml: bytes, xform: bytes, version_id: str) -> bytes:
    """The submission as one of another version of its form (`xform`), for odk_cli to load into it: the answers of
    questions this version doesn't have are dropped then.

    The nodes the version adds are added, as in its blank form (default included): JavaRosa takes a node missing from
    a submission for one not relevant when it was saved, and a question without a `relevant` would stay so."""
    root = _parse(xml)
    root.set("version", version_id)
    _add_missing(root, _primary_instance(_parse(xform)))
    return etree.tostring(root, encoding="UTF-8", xml_declaration=False)


def _parse(xml: bytes):
    # no entities, no network: the XML was sent by a device
    parser = XMLParser(huge_tree=True, resolve_entities=False, no_network=True)
    return etree.fromstring(fix_emoji(xml.decode("utf-8")), parser=parser)


def _primary_instance(xform):
    """The root of the form's own instance: the model's first `<instance>` (XForms), the others are secondary."""
    instance = next(xform.iter(f"{{{XFORMS}}}instance"))
    return _elements(instance)[0]


def _add_missing(saved, template) -> None:
    """Adds to `saved` the children of `template` it hasn't; into each repeat instance, those of the repeat's
    template."""
    for child in _elements(template):
        name = _local_name(child)
        if _is_repeat(template, name):
            if child.get(JR_TEMPLATE) is not None:
                for instance in _children_named(saved, name):
                    _add_missing(instance, child)
            continue
        existing = _children_named(saved, name)
        if existing:
            _add_missing(existing[0], child)
        else:
            saved.append(_blank_copy(child, etree.QName(saved).namespace))


def _blank_copy(template, namespace):
    """`template` in `namespace` (the submission's), without its repeats: no instance until one is answered."""
    name = _local_name(template)
    copy = etree.Element(f"{{{namespace}}}{name}" if namespace else name)
    copy.text = template.text
    for child in _elements(template):
        if not _is_repeat(template, _local_name(child)):
            copy.append(_blank_copy(child, namespace))
    return copy


def _is_repeat(parent, name: str) -> bool:
    return any(child.get(JR_TEMPLATE) is not None for child in _children_named(parent, name))


def _children_named(parent, name: str) -> list:
    return [child for child in _elements(parent) if _local_name(child) == name]


def _elements(parent) -> list:
    return [child for child in parent if isinstance(child.tag, str)]


def _find(root, path: str) -> list:
    elements = [root]
    for segment in path.strip("/").split("/"):
        name, _, index = segment.partition("[")
        index = index.rstrip("]")
        matching = [child for element in elements for child in element if _local_name(child) == name]
        if index == "*":
            elements = matching
        else:
            position = int(index or "1")
            elements = matching[position - 1 : position]
        if not elements:
            return []
    return elements


def _local_name(element) -> str:
    # comments and processing instructions have no name
    return etree.QName(element).localname if isinstance(element.tag, str) else ""
