from django.test import TestCase
import unittest
import hat.common.mock_jsonschema as schema


class SchemaTests(TestCase):
    def test_mock_ref(self):
        v = schema.mock_ref({
            '$ref': '#/definitions/foo'
        }, {
            'foo': {'type': 'boolean'}
        })
        self.assertIsInstance(v, bool)

    def test_mock_enum(self):
        v = schema.mock_enum({"enum": ["foo"]})
        self.assertEqual(v, "foo")

    def test_mock_object(self):
        v = schema.mock_object({
            'type': 'object',
            'properties': {'foo': {'type': 'string'}}
        })
        self.assertIsInstance(v, dict)
        self.assertIn('foo', v)
        self.assertIsInstance(v['foo'], str)

    def test_mock_array(self):
        v = schema.mock_array({
            'type': 'array',
            'items': {'type': 'string'},
            'minItems': 1,
            'maxItems': 1
        })
        self.assertEqual(len(v), 1)
        self.assertIsInstance(v[0], str)

    def test_mock_integer(self):
        v = schema.mock_integer({
            'type': 'integer',
            'minimum': 5,
            'maximum': 5
        })
        self.assertEqual(v, 5)

    def test_mock_number(self):
        v = schema.mock_number({
            'type': 'number',
            'minimum': 0,
            'maximum': 1
        })
        self.assertIsInstance(v, float)
        self.assertTrue(0 <= v <= 1)

    def test_mock_string(self):
        v = schema.mock_string({
            'type': 'string',
            'minLength': 5,
            'maxLength': 5
        })
        self.assertIsInstance(v, str)
        self.assertEqual(len(v), 5)

    @unittest.skip("todo")
    def test_mock_format(self):
        pass

    def test_mock_schema(self):
        v = schema.mock_schema({
            'type': 'object',
            'properties': {
                'enum': {'enum': [True, False]},
                'boolean': {'type': 'boolean'},
                'object': {
                    'type': 'object',
                    'properties': {
                        'ref': {'$ref': '#/definitions/bar'},
                    }
                },
                'array': {
                    'type': 'array',
                    'items': {'type': 'integer'},
                    'minItems': 1
                },
                'number': {'type': 'number'},
                'string': {'type': 'string'}
            },
            'definitions': {
                'bar': {'type': 'boolean'}
            }
        })
        self.assertIsInstance(v, dict)
        self.assertIsInstance(v['enum'], bool)
        self.assertIsInstance(v['boolean'], bool)
        self.assertIsInstance(v['object'], dict)
        self.assertIsInstance(v['object']['ref'], bool)
        self.assertIsInstance(v['array'], list)
        self.assertIsInstance(v['array'][0], int)
        self.assertIsInstance(v['number'], float)
        self.assertIsInstance(v['string'], str)
