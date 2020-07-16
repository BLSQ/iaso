from bs4 import BeautifulSoup as Soup
from datetime import datetime
from django.utils.text import slugify


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
    soup = Soup(file.read(), "xml")
    return get_children_tree(soup)


def flat_parse_xml_file(file):
    soup = Soup(file.read(), "xml")
    flat_xml_dict = {}
    get_flat_children_tree(soup, flat_xml_dict)
    children = [c for c in soup.children]

    if len(children) == 1:
        root_element = children[0]
        if "version" in root_element.attrs:
            flat_xml_dict["_version"] = root_element.attrs["version"]
    return flat_xml_dict


def slugify_underscore(filename):
    return slugify(filename).replace("-", "_")


import re

sql_injection_geom_regex = re.compile(r'[^a-zA-Z0-9_]')


def geojson_queryset(queryset, geometry_field, pk_field='id', fields=[]):
    """
    This method is fast way to serialize to GeoJSON a queryset. The regular serializer is extremely slow and will need
    to be parsed from text to return in a Response object. This method is roughly 20x faster.
    :param queryset: queryset to return data from
    :param geometry_field: the field to be serialized to geojson
    :param pk_field: GeoJSON requires a primary key value, defaults to 'id'
    :param fields: List of fields to include in the result
    :return: a GeoJSON FeatureCollection with the requested data.
    """
    all_fields = [pk_field, *fields, 'geojson_queryset_result']
    # Try to avoid SQL injection in the geom_field name
    if sql_injection_geom_regex.match(geometry_field):
        raise ValueError("invalid geom field name")

    features_queryset = queryset.extra(
        select={'geojson_queryset_result': f'ST_AsGeoJSON({geometry_field})::json'})\
        .values(*all_fields)

    features = []
    for row in features_queryset:
        features.append({
            'type': 'Feature',
            'id': row['id'],
            'geometry': row['geojson_queryset_result'],
            'properties': {field: row[field] for field in fields}
        })

    return {
        'type': 'FeatureCollection',
        'crs': {
            'type': 'name',
            'properties': {
                'name': 'EPSG:4326'
            }
        },
        'features': features
    }
