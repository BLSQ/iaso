# SaaS Quota Enforcement and Account Deactivation

* Status: proposed
* Date: 2026-06-30
* Related tickets: CONSOLE-238, CONSOLE-281
* Related PRs: [iaso#3133](https://github.com/BLSQ/iaso/pull/3133), [saas#12](https://github.com/BLSQ/saas/pull/12)

## Context and Problem Statement

IASO is sold as a SaaS product through **Console** (Pegasus), where customers subscribe to plans (Trial, Starter, Growth, Scale, Enterprise) via Stripe. Each plan defines quotas on metrics such as monthly submissions, projects, storage, and users.

We need a graduated enforcement model:

1. **Soft enforcement (automatic):** when a quota is exceeded within the current billing period, store an explicit account/subscription status (e.g. `quota_exceeded`) and display a warning banner in the IASO web UI. Account managers should see a link to upgrade their plan on Console.
2. **Hard enforcement (manual, then automatic):** if the customer takes no action and the quota problem persists into the next month, an operator can block the account entirely. Initially this is done manually from the Django admin; later from Console; eventually automatically.

This ADR covers both the quota-awareness layer and the last-resort account lockdown. It applies **only when the `saas` plugin is enabled** (`PLUGINS=saas`) and a `SubscriptionTracker` exists for the account.

### Existing building blocks

| Component | Location | Role |
|-----------|----------|------|
| `SubscriptionTracker` | `plugins/saas/models/subscription_tracker.py` | Stores plan limits and denormalized usage per account |
| `Account.status` | `iaso/models/account.py` (to be added) | Single enum-like field driving both soft and hard enforcement |
| `AccountUsage` | `plugins/saas/models/account_usage.py` | Tracks usage metrics by period (day/week/month/year/all-time) |
| `account_usage_registry` | `plugins/saas/registry.py` | Pluggable registry for quota metric definitions |
| Account usage API | `plugins/saas/api/account_usage/` | Exposes usage to Console via API key (`by-accounts`, `current`) |
| Quota signals | `iaso/saas/quotas/` (PR #3133) | Increments usage on create/delete via Django signals |
| `sync_account_usage` | `plugins/saas/management/commands/` | Cron-friendly command to recompute usage from DB |

Console will poll IASO daily (mechanism TBD) to detect accounts with exceeded quotas, using the `by-accounts` endpoint.

## Decision Drivers

* **UX:** customers must understand when they exceeded quotas without losing access immediately (banner with upgrade link, dedicated access-denied page only for hard lockdown)
* **Security:** hard lockdown must block all API and dashboard access for every user of the account
* **Architectural cleanliness:** one `Account.status` field drives all enforcement levels; quota computation stays in the `saas` plugin
* **Phased delivery:** automate warnings first; defer automatic hard deactivation
* **Performance:** cache status on `Account` so normal page loads do not recalculate all quotas; avoid extra DB queries per request; disk-size quotas are computed via cron, not on every instance save
* **Reversibility:** status changes are reversible; no data deletion
* **Extensibility:** new enforcement levels are new enum values, not new boolean flags

## Considered Options

### Quota exceeded — how to notify

* **Cached quota status + in-app banner (chosen for v1):** quota computation updates a stored status such as `quota_exceeded`; IASO frontend reads this status and displays a banner. No API, write, or login blocking.
* **Compute quota status on every request:** rejected — expensive and unnecessary; quota status should be derived by scheduled jobs or usage updates, then cached.
* **API-level soft block:** reject writes when over quota. Rejected for v1 — too disruptive before customers have a self-service upgrade path, and this is a business decision to revisit later.
* **Email notification:** complementary channel, not a substitute for the banner. Can be added later by Console.

### Account status — single field for soft and hard locks

* **Enum-like `Account.status` field (chosen):** one field on `Account` drives all enforcement levels. Initial values:
  * `active` — normal operation
  * `quota_exceeded` — soft lock: banner only, IASO keeps working
  * `disabled` — hard lock: block dashboard and API access
  * Future values (not v1): `write_restricted`, `payment_overdue`, `grace_period`, etc.
* **Derived-only status:** compute status by comparing usage and limits every time it is needed. Rejected because it couples UI/API reads to quota computation cost.
* **Separate fields per lock type (e.g. `quota_exceeded` boolean + `disabled_at` timestamp):** rejected — duplicates state, harder to extend, and scatters enforcement logic.
* **`is_active` boolean:** rejected — cannot express soft vs hard lock or future intermediate states.

### Account lockdown — where to enforce

* **Status-driven enforcement (chosen):** behaviour depends on `Account.status`:
  * `quota_exceeded` → frontend shows banner; API and login remain open
  * `disabled` → auth layer blocks API and dashboard (CONSOLE-238)
* **Authentication layer for hard lock only:** check `Account.status == disabled` in DRF auth classes and Django auth backends, similar to Django's `User.is_active`.
* **Middleware only:** insufficient — JWT auth bypasses session middleware checks on API calls.
* **Permission-based:** requires changes to every endpoint; does not block unauthenticated-adjacent flows cleanly.
* **Logout-all + login block:** simpler but poor UX for already-logged-in users; still requires JWT handling.

### Scheduled status changes

* **Optional `status_effective_at` timestamp:** supports scheduling a future transition (e.g. SNT malaria accounts disabled after one month). A cron job applies the transition when `status_effective_at <= now()`. The status field remains the source of truth for enforcement; the timestamp only schedules when it takes effect.
* **`disabled_at` as enforcement mechanism:** rejected in favour of `Account.status`.

## Decision Outcome

### Level 1 — Quota warning banner (automatic, v1)

When any tracked metric exceeds its `SubscriptionTracker` limit for the current period:

* Set `Account.status` to `quota_exceeded` (updated by quota sync jobs when usage exceeds limits).
* Display a persistent banner on the IASO web UI for all users of the account.
* The banner names the exceeded metric(s) and includes a link to Console account management to upgrade the plan.
* Driven by `AccountUsage` (current period) compared against `SubscriptionTracker` limits by quota update jobs, not by recalculating every quota on every web request.
* Frontend reads `Account.status` (via bootstrap payload or dedicated endpoint) and shows the banner when status is `quota_exceeded`. Detailed exceeded metrics can come from `GET /api/saas/account-usage/current/`.
* **No API, write, or login blocking** at this level. IASO continues to work normally. Write restrictions may be implemented later as a new status value (e.g. `write_restricted`), but are explicitly out of scope for v1 and require a separate business decision.

### Level 2 — Console awareness (automatic, v1)

* Console calls `GET /api/saas/account-usage/by-accounts/` daily (API key auth) to list all accounts and their current usage.
* Console reads `Account.status` and the latest usage values from the `by-accounts` endpoint. It may also compare usage against plan limits (stored in Pegasus/Stripe) for reporting or consistency checks.
* This is the integration point for future automated emails or Console-side dashboards.

### Level 3 — Manual account lockdown (v1, CONSOLE-238)

When soft enforcement has not resolved the issue (e.g. quota exceeded into the next month with no upgrade):

* A Console admin sets `Account.status` to `disabled` from the **Django admin** on the IASO instance.
* Later: the same action triggered from **Console via API** (not in v1).

Implementation (Philip's proposal, adapted):

1. Add `Account.status` as a `TextChoices` enum, initially `active`, `quota_exceeded`, and `disabled`.
2. Optionally add `status_effective_at` for scheduled transitions (e.g. auto-disable on a given date).
3. **Soft lock (`quota_exceeded`):** quota sync jobs set status automatically; frontend shows banner; no auth blocking.
4. **Hard lock (`disabled`):** operator or future automation sets status; enforcement kicks in:
   * Create a dedicated HTML template: "Your account has been disabled."
   * **Dashboard view:** redirect users to the disabled page (instead of serving the React app).
   * **API:** extend DRF authentication classes (`CsrfExemptSessionAuthentication`, subclass of `JWTAuthentication`) to reject requests when `Account.status == disabled`. Raise a custom `APIException` with HTTP 403, error code `account_disabled`.
   * **Frontend:** intercept 403 responses with code `account_disabled` and redirect to the disabled page (mirroring the existing 401 → login redirect).
5. **Django admin** remains accessible (operators can set status back to `active`).
6. Avoid an extra query per request: use `select_related` on the auth backend's `get_user()` to fetch profile → account in one query.

### Level 4 — Automatic lockdown (future)

* Console detects persistent quota violations across billing periods and calls a new IASO API endpoint to set `Account.status` to `disabled`.
* Requires Level 2 (Console awareness) and Level 3 (lockdown mechanism) to be stable first.
* Out of scope for v1.

### Positive Consequences

* Graduated enforcement avoids surprising customers with immediate lockdown
* Single `Account.status` field drives both soft and hard enforcement — easy to read, easy to extend
* Status is reusable beyond SaaS (e.g. SNT malaria time-limited accounts via scheduled `status_effective_at`)
* Auth-layer enforcement is centralized and hard to bypass
* Dedicated disabled page gives clear UX vs a generic 403
* Quota tracking is decoupled from enforcement via the `AccountUsage` registry

### Negative Consequences

* Two parallel data sources for limits: `SubscriptionTracker` (IASO) and plan definitions (Console/Pegasus). Must stay in sync.
* Signal-based quota updates (PR #3133) have known performance risks for disk-size metrics; mitigated by moving disk computation to a cron job.
* PR #3133 places quota definitions in `iaso/saas/quotas/` (core) rather than the plugin — team discussion ongoing (tdethier: "this whole directory should be in the plugin").
* Automatic lockdown deferred — operators must act manually in v1.

## Pros and Cons of the Options

### In-app banner only (soft enforcement)

* Good, because Non-disruptive; customers can keep working while deciding to upgrade
* Good, because Fully automatic; no operator intervention needed
* Good, because Clear call-to-action with link to Console
* Bad, because Customers can ignore the banner and keep exceeding quotas
* Bad, because Does not prevent API abuse if someone scripts against the API

### Single `Account.status` for soft and hard locks

* Good, because One field, one source of truth for enforcement behaviour
* Good, because IASO and Console can quickly know if an account is `quota_exceeded` or `disabled`
* Good, because New enforcement levels are new enum values, not new fields or booleans
* Good, because The frontend does not need to trigger heavy quota recalculations
* Bad, because Status can become stale if quota sync jobs fail
* Bad, because We need clear ownership and rules for transitions between statuses

### Authentication-layer lockdown (hard enforcement)

* Good, because Blocks all API and dashboard access in one place
* Good, because Mirrors Django's proven `is_active` pattern
* Good, because Dedicated error code enables clean frontend redirect
* Bad, because Requires careful handling of JWT (stateless token + stateful account check)
* Bad, because Must not accidentally lock out Django admin operators

### Permission-based enforcement

* Good, because Allows per-feature granularity
* Bad, because Must touch every endpoint and permission check
* Bad, because Easy to miss an endpoint, creating security holes

## Implementation phases

| Phase | What | Automation | Trigger |
|-------|------|------------|---------|
| 1 | Quota tracking (`AccountUsage`, signals, cron) | Automatic | PR #3133, saas#12 |
| 2 | `Account.status = quota_exceeded` + warning banner | Automatic | Quota exceeded in current period |
| 3 | Console daily status check | Automatic | Cron on Console side |
| 4 | Manual hard lock (`status = disabled`, Django admin) | Manual | Operator decision |
| 5 | Manual hard lock from Console | Manual | Console admin action via API |
| 6 | Automatic hard lock (`status = disabled`) | Automatic | Persistent quota violation |

## Open questions

* **Sync mechanism:** how do `SubscriptionTracker` limits stay aligned with Console/Stripe plan changes? Webhook on subscription update?
* **Status transitions:** who is allowed to change `Account.status`? Quota jobs set `quota_exceeded`/`active` automatically; only operators set `disabled` in v1?
* **Which metrics trigger status change?** All quotas, or only specific ones (e.g. submissions but not storage)?
* **Grace period:** how many days into the new billing period before hard lock is considered?
* **Re-enable flow:** does upgrading on Console automatically set status back to `active`, or does an operator need to act?
* **SaaS scope:** should `quota_exceeded` only be set when the `saas` plugin is active and a `SubscriptionTracker` exists?
* **Architecture:** should `iaso/saas/quotas/` live in core or move entirely into `plugins/saas`?
* **Disk-size quota:** cache file sizes incrementally vs full S3 re-scan on cron (see PR #3133 review thread).

## References

* Philip's analysis: CONSOLE-238 (account deactivation — authentication-layer approach)
* Hugo's quota implementation: CONSOLE-281, [iaso#3133](https://github.com/BLSQ/iaso/pull/3133)
* SaaS plugin quotas: [saas#12](https://github.com/BLSQ/saas/pull/12)
* Console (Pegasus): https://github.com/BLSQ/console/
* SaaS plugin README: `plugins/saas/README.md`
