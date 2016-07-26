from datetime import datetime
from django.test import TestCase
from pandas import DataFrame
from hat.historic import transform


class TransformTests(TestCase):
    def test_is_cattdilution_positive(self):
        self.assertTrue(transform.is_cattdilution_positive(1))
        self.assertTrue(transform.is_cattdilution_positive(5))
        self.assertFalse(transform.is_cattdilution_positive(0))
        self.assertFalse(transform.is_cattdilution_positive(99))

    def test_is_md_positive(self):
        self.assertTrue(transform.is_md_positive(-1))
        self.assertFalse(transform.is_md_positive(1))
        self.assertFalse(transform.is_md_positive(0))

    def test_parse_pl_result(self):
        self.assertEqual(transform.parse_pl_result(1), 'stage1')
        self.assertEqual(transform.parse_pl_result(2), 'stage2')
        self.assertEqual(transform.parse_pl_result(3), 'unknown')
        self.assertEqual(transform.parse_pl_result(0), 'none')

    def test_parse_sex(self):
        self.assertEqual(transform.parse_sex('Féminin'), 'female')
        self.assertEqual(transform.parse_sex('Masculin'), 'male')
        self.assertEqual(transform.parse_sex('XX'), 'unknown')

    def test_reduce_results(self):
        data = {
            'foo': 1,
            'bar': 0
        }
        tests = [
            ('foo', lambda x: x == 1),
            ('bar', lambda x: x != 0)
        ]
        r = transform.reduce_results(tests, data)
        self.assertEqual(r, 'positive')

    def test_create_docid(self):
        r1 = (11, 12)
        r2 = (11, 12)
        r3 = (11, 13)
        self.assertEqual(
            transform.create_docid(r1), transform.create_docid(r2))
        self.assertNotEqual(
            transform.create_docid(r1), transform.create_docid(r3))

    def test_transform_cards(self):
        df = DataFrame({
            'F_TIMESTAMP': [datetime.today()],
            'IF_UM': ['mobile_unit'],
            'IM_UM_CT': ['treatment_center'],

            'IM_NAME': ['name'],
            'IM_LASTNAME': ['lastname'],
            'IM_PRENAME': ['prename'],
            'IM_SEX': ['Féminin'],
            'IM_AGE': [11],
            'IM_BIRTHYEAR': [2005],
            'IM_MERE': ['mother'],

            'IM_AD_VILLAGE': ['village'],
            'IM_AD_PROVINCE': ['province'],
            'IM_AD_HEALTH_ZONE': ['zone'],
            'IM_AD_HEALTH_AREA': ['area'],

            'D_DATE': [datetime.today()],

            # screening
            'D_CATT_TOTAL_BLOOD': [-1],
            # confirmation
            'D_CATT_DILUTION': [1],
            # pl
            'DS_PL_RESULT': [2],
        })

        df2 = transform.transform(df)

        self.assertRegex(str(df2['entry_date'].dtype), r'datetime')

        self.assertTrue(all(df2['mobile_unit'] == ['mobile_unit']))
        self.assertTrue(all(df2['treatment_center'] == ['treatment_center']))

        self.assertTrue(all(df2['name'] == ['name']))
        self.assertTrue(all(df2['lastname'] == ['lastname']))
        self.assertTrue(all(df2['prename'] == ['prename']))
        self.assertTrue(all(df2['sex'] == ['female']))
        self.assertTrue(all(df2['age'] == [11]))
        self.assertTrue(all(df2['year_of_birth'] == [2005]))
        self.assertTrue(all(df2['mothers_surname'] == ['mother']))

        self.assertTrue(all(df2['village'] == ['village']))
        self.assertTrue(all(df2['province'] == ['province']))
        self.assertTrue(all(df2['ZS'] == ['zone']))
        self.assertTrue(all(df2['AZ'] == ['area']))

        self.assertRegex(str(df2['document_date'].dtype), r'datetime')
        self.assertIsInstance(df2.loc[0]['document_id'], str)

        self.assertTrue(all(df2['hat_id'] == ['lanapr2005m']))

        self.assertTrue(all(df2['screening_test_result'] == ['positive']))
        self.assertTrue(all(df2['confirmation_test_result'] == ['positive']))
        self.assertTrue(all(df2['PL_test_result'] == ['stage2']))
