# Notify IASO Users on Web and Mobile

* Status: proposed
* Date: 2026-11-04

## Context and Problem Statement

IASO has no way to tell a user that something happened that concerns them. The immediate need comes from the
validation workflows: when a submission is accepted or rejected, or when a node of the workflow is waiting for a
user's decision, the people involved currently have to go and look for it themselves.

Other needs are already visible and must not be blocked by the first implementation:

* announcements to a group of users ("please synchronise your data", "please update your app", ...);
* purely informational messages that require no action ("your payment has been sent").

Users work both on the web interface and on the mobile application, so notifications must reach both.

Two constraints shape the design:

* **Multi-account.** IASO serves many accounts from the same instance, and a person can have several account users
  (see `TenantUser`). A notification must never cross an account boundary: it is created in one account and can
  only be read by a user of that account.
* **Local hosting.** Some IASO instances run on servers we do not control. Sending a push notification through
  Google Firebase Cloud Messaging (FCM) requires a credential tied to our Firebase project, and that credential
  cannot be handed over to third-party hosts.

## Decision Drivers

* One generic mechanism rather than a feature built specifically for validation workflows
* Strict isolation between accounts
* Works for SaaS and locally hosted instances without distributing our FCM credentials
* Reliable even when the user has disabled push notifications on their device
* No personal or sensitive data in third-party push payloads (GDPR and similar regulations)
* Not being flagged as a spammer by push providers
* Small first iteration, extensible to other channels later
* Development and maintenance cost (prefer an existing library if one fits)

## Decisions

The following points were agreed upon. Section [Open Questions](#open-questions) lists what still needs to be
decided, and comments are welcome on both.

### 1. A generic notification model, first used by validation workflows

IASO gets a generic notification system. The first (and for now only) producer is the validation workflow, but
nothing in the model is specific to it. Broadcasts to groups of users come later and will reuse the same model.

### 2. Notifications, not a chat

A notification cannot be replied to. There is no conversation, no thread and no reply endpoint. This is an explicit
non-goal.

### 3. A notification is a type, some data and a default message

Each notification has:

* a **type** (e.g. `validation.submission_rejected`, `validation.awaiting_decision`, `payment.sent`,
  `announcement`), from a list maintained in the code. The type tells the web and mobile clients how to display
  the notification and what to do when it is tapped;
* **data**: a small JSON object, mostly identifiers (`instance_id`, `validation_node_id`, `form_id`, ...), that lets
  the client open the corresponding object;
* a **default message** (title and body) that clients can display as is, for instance when they do not know the
  type yet (older app versions).

Notifications must be **actionable when it makes sense**: tapping a validation notification opens the submission or
the decision to take. Some types have no target (e.g. `payment.sent`) and only display the message.

A client that receives a type it does not know falls back to the default message and does nothing on tap.

### 4. Pull is the source of truth, push is a best-effort signal

Users can disable push notifications, devices can be offline and push providers drop messages. Therefore:

* every notification is **stored in IASO** and can always be fetched through the API (the "inbox");
* IASO tracks a **read status** per notification;
* push (and later other channels) is only a way to tell the user, or the app, that something new is there.

Both clients get a notification screen backed by the inbox. On mobile, the existing notification screen is merged
with this new one instead of adding a second one.

### 5. Several delivery channels behind one interface

Creating a notification and delivering it are two separate steps. Delivery goes through **channels**:

* in-app inbox (always, it is the stored notification itself);
* FCM push (mobile);
* email.

Later, and only when needed: SMS, WhatsApp, Telegram, Slack, ...

Each delivery attempt is recorded with its channel and status (pending, sent, failed, ...) so that we know what was
actually sent. Channels can be tried in an order of priority, and a user preference page may later let users choose
their channels. Neither is required for the first iteration.

### 6. Push goes through a relay service operated by Bluesquare

IASO does not call FCM directly. A small, separate **push relay service**, operated by Bluesquare, holds the FCM
credentials and forwards push requests to Google.

* Every IASO instance (our SaaS instances as well as locally hosted ones) authenticates to the relay with its own
  key. Locally hosted instances can thus send push notifications without ever seeing our FCM credentials.
* The relay keeps track of what each instance sends, can rate-limit it and can revoke its access.
* An instance without access to the relay still works: notifications are stored and can be pulled, only the push
  channel is unavailable.

We do not use a paid third-party service (e.g. Urban Airship): it adds a dependency and a cost for something FCM
already does for free. We do not build on a self-hosted push server (e.g. ntfy) either, unless a client explicitly
asks, and pays, for a setup without Google services.

### 7. Device registration: one user, possibly several devices

A user can use IASO on several devices and must be notified on all of them. The mobile app registers its FCM token
with IASO after login, and IASO stores, per token:

* the user (the account user, see below);
* the existing `Device` when it is known, so that push tokens remain tied to the devices IASO already tracks;
* the platform / application;
* whether notifications are currently allowed on the device (reported by the app);
* timestamps (created, last seen).

An FCM token identifies an app installation, not a physical device, and it changes over time. Tokens are refreshed
by the app, removed at logout, and invalidated when FCM reports them as unregistered.

### 8. Respect disabled notifications

We do not send pushes to devices whose user disabled notifications, and we stop using tokens that FCM rejects.
Repeatedly pushing to such devices is what gets a sender flagged as spam.

### 9. Minimal payloads

Push payloads go through Google's infrastructure. They contain the notification id, its type and a short generic
text, never personal or health data (no patient names, no form contents, ...). The client fetches the full
notification from IASO through the authenticated pull endpoint.

The same caution applies to the default message stored in the notification, as it may be sent by email or other
channels later.

### 10. Account isolation and permissions

* A notification belongs to exactly one **account** and one **recipient**, and the recipient must be a user of that
  account. For a person with several accounts (`TenantUser`), the recipient is the account user, so notifications
  of one account are never shown while logged into another one.
* All notification and device endpoints are filtered on the account of the requesting user.
* In the first iteration, notifications are only created by the system (the validation workflow) for users that
  are already part of the workflow. No API allows a user to send an arbitrary notification.
* When broadcasts are added, sending will require a dedicated permission, and the target users will be restricted
  to the sender's account (and, where relevant, to their org unit and project scope).

## Sketch of the Data Model

This sketch only illustrates the decisions above; field names are not final and may come from a library
(see [Open Questions](#open-questions)).

* `Notification`: `account`, `recipient` (user), `type`, `data` (JSON), `title`, `body`, `created_at`,
  `created_by` (nullable, null for system notifications), `read_at` (nullable)
* `NotificationDelivery`: `notification`, `channel`, `status`, `attempted_at`, `error`, `external_id`
* `PushDevice`: `user`, `device` (nullable FK to `Device`), `token`, `platform`, `notifications_enabled`,
  `created_at`, `last_seen_at`, `active`

Following [ADR 0000](0000-use-one-api-endpoint-per-operation.md), each operation gets its own endpoint, e.g.:

* list the current user's notifications (paginated, filterable on read/unread);
* count unread notifications;
* mark a notification as read;
* mark all notifications as read;
* register / update a push device;
* unregister a push device.

## Open Questions

### Build our own models or use an existing library?

The notification model looks standard, so we should check whether existing Django libraries cover it before
writing our own.

#### Option A: implement the models ourselves

* Good, because the models fit exactly our needs (account, types, data, delivery tracking)
* Good, because account isolation is built in from the start rather than added on top
* Good, because no extra dependency to maintain and upgrade
* Bad, because we write and maintain code that already exists elsewhere (FCM error handling, token lifecycle, ...)

#### Option B: `django-push-notifications` (Jazzband)

Provides device models (FCM, APNS, Web Push) and the code to send pushes to them.

* Good, because mature and maintained, with FCM HTTP v1 support and token handling
* Good, because it could be used *inside the push relay service* to talk to FCM
* Bad, because it covers the push channel only: no inbox, no read status, no email or other channels
* Bad, because it is meant to send directly to FCM with the credentials on the server, which is exactly what the
  relay is there to avoid in IASO itself
* Bad, because its device model is not account-aware and does not relate to our `Device` model

#### Option C: an inbox library such as `django-notifications-hq`

Provides a `Notification` model (actor / verb / target with generic foreign keys) with read/unread status.

* Good, because the inbox and read status come for free
* Bad, because it is not multi-account: the account filter must be added everywhere
* Bad, because generic foreign keys are harder to query and to keep consistent than explicit fields
* Bad, because it has no notion of delivery channels

#### Option D: combine

E.g. our own `Notification` / `NotificationDelivery` models in IASO, and `django-push-notifications` (or an
existing push server) inside the relay.

Other libraries are worth a look before deciding. Comments welcome.

### What is the relay service built with?

* A small dedicated service (Django or FastAPI) maintained by us, possibly using `django-push-notifications`
* An existing open source push gateway (e.g. Gorush) with an authentication layer in front of it

In both cases: how are relay keys issued to instances, and do we start with the relay right away or first send
from our SaaS instances directly and add the relay before the first locally hosted instance needs push?

### Other questions

* **Web delivery**: is polling the unread count enough for the web interface, or do we want browser push
  (FCM Web Push) as well?
* **Translations**: is the default message rendered in the recipient's language when the notification is created,
  or rendered at read time from the type and data?
* **Retention**: how long do we keep read notifications and delivery logs?
* **Email**: which validation events deserve an email, and do we send one email per event or a digest?
* **Preferences**: do users need to opt out of some types or channels in the first iteration, or can this wait?
