from time import sleep

DEFAULT_QUOTA_LIMIT = 60
THRESHOLD = 0.1
INCREASE_SLEEP_PERIOD_IN_SECONDS = 0.5
SLEEP_PERIOD_IN_SECONDS = 5


class QuotaManager:
    quota_read_limit = DEFAULT_QUOTA_LIMIT
    total_requests = 0

    def __init__(self, quota_read_limit=DEFAULT_QUOTA_LIMIT) -> None:
        self.quota_read_limit = quota_read_limit

    def increase(self, by=1):
        self.total_requests += by
        sleep(INCREASE_SLEEP_PERIOD_IN_SECONDS * by)
        limit = int(self.quota_read_limit - self.quota_read_limit * THRESHOLD)
        if self.total_requests % limit in range(0, by):
            print(f"Sleeping extra {SLEEP_PERIOD_IN_SECONDS}s")
            sleep(SLEEP_PERIOD_IN_SECONDS)
