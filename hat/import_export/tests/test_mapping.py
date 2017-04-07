from django.test import TestCase

from hat.cases.filters import ResultValues
from ..mapping import \
    historic_get_catt_blood_result, \
    historic_get_result, \
    mobile_get_result, \
    pv_get_catt_blood_result, \
    pv_get_result, \
    reduce_test_result


class MappingTests(TestCase):
    def test_historic_get_result(self):
        null_value = 99
        positive = -1
        negative = 1

        self.assertEqual(historic_get_result(null_value), None)
        self.assertEqual(historic_get_result(positive), ResultValues.positive.value)
        self.assertEqual(historic_get_result(negative), ResultValues.negative.value)
        self.assertNotEqual(historic_get_result(negative + 2), None)

    def test_historic_get_catt_blood_result(self):
        null_value = 99
        positive = -2
        negative = 0

        self.assertEqual(historic_get_catt_blood_result(null_value), None)
        self.assertEqual(historic_get_catt_blood_result(positive), ResultValues.positive.value)
        self.assertEqual(historic_get_catt_blood_result(negative), ResultValues.negative.value)
        self.assertEqual(historic_get_catt_blood_result(negative + 5), ResultValues.negative.value)

    def test_mobile_get_result(self):
        self.assertEqual(mobile_get_result('positive'), ResultValues.positive.value)
        self.assertEqual(mobile_get_result('negative'), ResultValues.negative.value)
        self.assertEqual(mobile_get_result('missing'), ResultValues.missing.value)
        self.assertEqual(mobile_get_result('absent'), ResultValues.absent.value)
        self.assertEqual(mobile_get_result('not'), None)

    def test_pv_get_result(self):
        self.assertEqual(pv_get_result(None), None)
        self.assertEqual(pv_get_result('+'), ResultValues.positive.value)
        self.assertEqual(pv_get_result('NF'), ResultValues.missing.value)
        self.assertEqual(pv_get_result('0'), ResultValues.negative.value)

    def test_pv_get_catt_result(self):
        self.assertEqual(pv_get_catt_blood_result(None), None)
        self.assertEqual(pv_get_catt_blood_result('NEG'), ResultValues.negative.value)
        self.assertEqual(pv_get_catt_blood_result('POS++'), ResultValues.positive.value)

    def test_reduce_test_result(self):
        positive = ResultValues.positive.value
        negative = ResultValues.negative.value
        absent = ResultValues.absent.value
        missing = ResultValues.missing.value

        self.assertEqual(reduce_test_result(None, None), None)
        self.assertEqual(reduce_test_result(positive, None), positive)
        self.assertEqual(reduce_test_result(None, positive), positive)
        self.assertEqual(reduce_test_result(positive, negative), positive)
        self.assertEqual(reduce_test_result(missing, absent), absent)
