"""Fixed log-scale latency histogram.

Bucket ``i`` counts durations in ``(10 ** ((i - 1) / 10), 10 ** (i / 10)]`` milliseconds, i.e. 10 buckets per decade
(each ~26% wide) from 1ms to 10**7 ms (~2.8h, long enough for background tasks). Bucket 0 holds everything <= 1ms and
the last bucket everything above the range.

Because every histogram uses the same bounds, histograms can be summed element-wise across workers, servers and
time ranges, and percentiles computed on the result (unlike stored percentiles, which can't be combined).
"""

import math

from typing import Optional, Sequence


BUCKETS_PER_DECADE = 10
MAX_EXPONENT = 7  # 10**7 ms = ~2.8h
OVERFLOW_INDEX = BUCKETS_PER_DECADE * MAX_EXPONENT + 1
BUCKET_COUNT = OVERFLOW_INDEX + 1


def upper_bound_ms(index: int) -> float:
    return 10 ** (index / BUCKETS_PER_DECADE)


def bucket_index(duration_ms: float) -> int:
    if duration_ms <= 1:
        return 0
    index = math.ceil(BUCKETS_PER_DECADE * math.log10(duration_ms))
    return min(index, OVERFLOW_INDEX)


def empty_buckets() -> list[int]:
    return [0] * BUCKET_COUNT


def merge_buckets(target: list[int], other: Sequence[int]) -> list[int]:
    for i, value in enumerate(other):
        target[i] += value
    return target


def percentile(buckets: Sequence[int], q: float, max_ms: Optional[float] = None) -> Optional[float]:
    """Estimate the ``q`` quantile (0 < q <= 1) in milliseconds.

    Interpolates geometrically inside the bucket holding the target rank, so the error is bounded by the bucket
    width. ``max_ms``, when known, caps the estimate (useful for the open-ended overflow bucket).
    """
    total = sum(buckets)
    if total == 0:
        return None
    rank = q * total
    cumulative = 0
    for index, count in enumerate(buckets):
        if count == 0:
            continue
        if cumulative + count >= rank:
            if index == 0:
                estimate = 1.0
            elif index == OVERFLOW_INDEX:
                estimate = max_ms if max_ms is not None else upper_bound_ms(OVERFLOW_INDEX - 1)
            else:
                low, high = upper_bound_ms(index - 1), upper_bound_ms(index)
                fraction = (rank - cumulative) / count
                estimate = low * (high / low) ** fraction
            return min(estimate, max_ms) if max_ms is not None else estimate
        cumulative += count
    return max_ms
