from unittest.mock import patch
from django.test import TestCase
from ..filters import DatePeriod, resolve_dateperiod


class FilterTests(TestCase):
    def test_resolve_dateperiod(self):
        from datetime import datetime
        import pytz
        # Here we mock datetime.today, but just the one imported into the module.
        # Like described here:
        # http://www.voidspace.org.uk/python/mock/examples.html#partial-mocking
        with patch('hat.api.filters.datetime') as mock_datetime:
            mock_datetime.today.return_value = datetime(2016, 7, 11)
            mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)

            (date_from, date_to) = resolve_dateperiod(DatePeriod.current_month.value)
            self.assertEqual(date_from, datetime(2016, 7, 1, tzinfo=pytz.UTC))
            self.assertEqual(date_to, datetime(2016, 7, 12, tzinfo=pytz.UTC))

            (date_from, date_to) = resolve_dateperiod(DatePeriod.current_trimester.value)
            self.assertEqual(date_from, datetime(2016, 5, 1, tzinfo=pytz.UTC))
            self.assertEqual(date_to, datetime(2016, 7, 12, tzinfo=pytz.UTC))

            (date_from, date_to) = resolve_dateperiod(DatePeriod.current_year.value)
            self.assertEqual(date_from, datetime(2016, 1, 1, tzinfo=pytz.UTC))
            self.assertEqual(date_to, datetime(2016, 7, 12, tzinfo=pytz.UTC))

            (date_from, date_to) = resolve_dateperiod(DatePeriod.last_month.value)
            self.assertEqual(date_from, datetime(2016, 6, 1, tzinfo=pytz.UTC))
            self.assertEqual(date_to, datetime(2016, 7, 1, tzinfo=pytz.UTC))

            (date_from, date_to) = resolve_dateperiod(DatePeriod.last_trimester.value)
            self.assertEqual(date_from, datetime(2016, 1, 1, tzinfo=pytz.UTC))
            self.assertEqual(date_to, datetime(2016, 5, 1, tzinfo=pytz.UTC))

            (date_from, date_to) = resolve_dateperiod(DatePeriod.last_year.value)
            self.assertEqual(date_from, datetime(2015, 1, 1, tzinfo=pytz.UTC))
            self.assertEqual(date_to, datetime(2016, 1, 1, tzinfo=pytz.UTC))

            (date_from, date_to) = resolve_dateperiod(DatePeriod.since_last_year.value)
            self.assertEqual(date_from, datetime(2015, 1, 1, tzinfo=pytz.UTC))
            self.assertEqual(date_to, datetime(2016, 7, 12, tzinfo=pytz.UTC))

            (date_from, date_to) = resolve_dateperiod(DatePeriod.since_two_years.value)
            self.assertEqual(date_from, datetime(2014, 1, 1, tzinfo=pytz.UTC))
            self.assertEqual(date_to, datetime(2016, 7, 12, tzinfo=pytz.UTC))

            (date_from, date_to) = resolve_dateperiod(DatePeriod.since_three_years.value)
            self.assertEqual(date_from, datetime(2013, 1, 1, tzinfo=pytz.UTC))
            self.assertEqual(date_to, datetime(2016, 7, 12, tzinfo=pytz.UTC))

            # TODO: test edge cases where last-* is in last year
            # mock_datetime.today.return_value = datetime(2016, 1, 11)
