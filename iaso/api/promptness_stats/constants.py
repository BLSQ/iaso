STATUS_ON_TIME = "ON_TIME"
STATUS_LATE = "LATE"
STATUS_MISSING = "MISSING"

PROMPTNESS_STATUSES = [STATUS_ON_TIME, STATUS_LATE, STATUS_MISSING]

# Instance field used to decide whether a submission was on time.
# To be confirmed with the client: `created_at` (reception on the server) or `source_created_at` (creation on the device)
SUBMISSION_TIMESTAMP_FIELD = "created_at"
