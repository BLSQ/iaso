import pandas
from django.core.management.base import BaseCommand
from hat.import_export.transform import MAPPING
from hat.cases.models import Case


def get_source_field(mapping, source_type):
    if 'sources' not in mapping:
        return None
    if source_type not in mapping['sources']:
        return None
    field_config = mapping['sources'][source_type]
    source_fields = []
    if isinstance(field_config, tuple):
        source_fields = [' > '.join(field_config)]
    elif isinstance(field_config, dict):
        if 'field' in field_config:
            source_fields = [' > '.join(field_config['field'])]
        elif 'fields' in field_config:
            source_fields = [' > '.join(f['field']) for f in field_config['fields']]
    return ','.join(source_fields)


def get_samples(mapping):
    field = mapping['import_field']
    result = Case.objects.values(field).distinct()[:20]
    return [col[field] for col in result]


class Command(BaseCommand):
    help = 'Export the mapping as csv'

    def add_arguments(self, parser):
        parser.add_argument('filename', type=str, help='Set the export filename')

    def handle(self, *args, **options):
        rows = []
        for mapping in MAPPING:
            rows.append({
                'field': mapping['import_field'],
                'pv': get_source_field(mapping, 'pv'),
                'historic': get_source_field(mapping, 'historic'),
                'mobile': get_source_field(mapping, 'mobile'),
                'test_type': mapping.get('test_type', None),
                'samples': get_samples(mapping)
            })
        df = pandas.DataFrame(rows)
        columns = ['field', 'pv', 'historic', 'mobile', 'test_type', 'samples']
        df.to_csv(options['filename'], index=False, sep=';', columns=columns)
