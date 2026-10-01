from django.test import SimpleTestCase

from iaso.perf_stats.histogram import (
    BUCKET_COUNT,
    OVERFLOW_INDEX,
    bucket_index,
    empty_buckets,
    percentile,
    upper_bound_ms,
)


class HistogramTestCase(SimpleTestCase):
    def test_bucket_index(self):
        self.assertEqual(bucket_index(0), 0)
        self.assertEqual(bucket_index(1), 0)
        self.assertEqual(bucket_index(1.1), 1)
        self.assertEqual(bucket_index(10), 10)
        self.assertEqual(bucket_index(10.1), 11)
        self.assertEqual(bucket_index(10_000_000), OVERFLOW_INDEX - 1)
        self.assertEqual(bucket_index(100_000_000), OVERFLOW_INDEX)
        self.assertEqual(BUCKET_COUNT, OVERFLOW_INDEX + 1)

    def test_every_duration_falls_under_its_bucket_upper_bound(self):
        for duration in [1.5, 7, 42, 250, 999, 12_345, 99_999]:
            index = bucket_index(duration)
            self.assertLess(upper_bound_ms(index - 1), duration)
            self.assertLessEqual(duration, upper_bound_ms(index))

    def test_percentile_empty(self):
        self.assertIsNone(percentile(empty_buckets(), 0.95))

    def test_percentile_is_close_to_exact_value(self):
        durations = list(range(1, 1001))  # 1..1000 ms, uniform
        buckets = empty_buckets()
        for duration in durations:
            buckets[bucket_index(duration)] += 1
        for q, exact in [(0.5, 500), (0.95, 950), (0.99, 990)]:
            estimate = percentile(buckets, q, max_ms=1000)
            self.assertLess(abs(estimate - exact) / exact, 0.15, f"p{q}: {estimate} vs {exact}")

    def test_percentile_capped_by_max(self):
        buckets = empty_buckets()
        buckets[bucket_index(150)] = 10
        self.assertLessEqual(percentile(buckets, 0.99, max_ms=150), 150)

    def test_percentile_overflow_uses_max(self):
        buckets = empty_buckets()
        buckets[OVERFLOW_INDEX] = 1
        self.assertEqual(percentile(buckets, 0.5, max_ms=250_000), 250_000)
