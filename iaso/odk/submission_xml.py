"""Changes to a submission's XML that odk_cli `edit` doesn't make itself, done before it runs: it then loads the result
as the submission and computes again what depends on it."""

from lxml import etree  # type: ignore
from lxml.etree import XMLParser

from iaso.utils.emoji import fix_emoji


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


def _parse(xml: bytes):
    # no entities, no network: the XML was sent by a device
    parser = XMLParser(huge_tree=True, resolve_entities=False, no_network=True)
    return etree.fromstring(fix_emoji(xml.decode("utf-8")), parser=parser)


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
