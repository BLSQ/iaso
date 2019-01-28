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
