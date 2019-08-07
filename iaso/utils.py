from bs4 import BeautifulSoup as Soup
from datetime import datetime


def timestamp_to_datetime(timestamp):
    date = datetime.fromtimestamp(timestamp)
    return date.strftime("%Y-%m-%d %H:%M:%S")


def get_flat_children_tree(el, flat_xml_dict):
    for children in el.findChildren(None, {}, False):
        if len(children.findChildren(None, {}, False)) > 0:
            get_flat_children_tree(children, flat_xml_dict)
        else:
            flat_xml_dict[children.name] = children.text


def get_children_tree(el):
    xml_dict = {}
    for children in el.findChildren(None, {}, False):
        if len(children.findChildren(None, {}, False)) > 0:
            xml_dict[children.name] = get_children_tree(children)
        else:
            xml_dict[children.name] = children.text
    return xml_dict


def parse_xml_file(file):
    soup = Soup(file.read(), features="html.parser")
    return get_children_tree(soup)


def flat_parse_xml_file(file):
    soup = Soup(file.read(), features="html.parser")
    flat_xml_dict = {}
    get_flat_children_tree(soup, flat_xml_dict)
    return flat_xml_dict
