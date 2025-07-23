# SaaS modelization

This document will explain the necessary changes that will be made to prepare the SaaS version of the application.

General philosophy of IASO SaaS:
- clients will be able to choose a subscription plan, based on their needs
- each plan has a set of limits (number of submissions, disk size, number of projects, etc.)
- if some limit is exceeded, the client will always be able to continue submitting data (therefore exceeding even more the limit), but they won't be able to visualize any of their submissions
  - are they not able to visualize any other type of data?
  - should the concerned API endpoints return anything special when the limit is exceeded? `402` error?


## Table of contents
1. [Use cases](#use-cases)
2. [Data model](#data-model)
3. [API](#api) 


## Use cases

```mermaid
---
title: SaaS use cases
---

flowchart LR
    U["fa:fa-user User"]
    UC1(1 - Create a new subscription)
    UC1Comment[/"fa:fa-info there is no existing account - done through a setuper action"/]
    UC2(2 - Start a new subscription)
    UC2Comment[/"fa:fa-info there already is an account - done through a dedicated endpoint"/]
    UC3(3 - Renew a subscription)
    UC4(4 - Cancel a subscription)
    UC5(5 - Change subscription)
    UC5Comment[/"fa:fa-info upgrade? downgrade? what happens to the existing plan?"/]
    UC6(6 - See information about current subscription)
    UC7(7 - See information about other existing subscriptions)
    U --> UC1
    UC1 -.- UC1Comment
    U --> UC2
    UC2 -.- UC2Comment
    U --> UC3
    U --> UC4
    U --> UC5
    UC5 -.- UC5Comment
    U --> UC6
    U --> UC7
```



## Data model

```mermaid
---
title: SaaS data model
---

classDiagram
    class Account {
        id : int
        ...
        /has_active_subscription : bool
        /can_display_submissions : bool
    }
    
    class SubscriptionTracker {
        id : int
        created_at : datetime
        updated_at : datetime
        total_submissions : int
        total_disk_size? : float
        /total_projects : int
        /is_over_plan_limit : bool
        /current_subscription : Optional[Subscription]
        is_project_limit_exceeded() bool
        is_submissions_limit_exceeded() bool
        is_disk_size_limit_exceeded() bool
        update_submission_metrics(submissions) None
        create_subscription(subscription_plan, start_date, expiration_date, payment_id, payment_provider, admin) Subscription
        renew_subscription(subscription, payment_id, payment_provider) None
        change_subcription_plan(subscription, new_plan, payment_id, payment_provider) None
        cancel_subscription(subscription) None
    }
    note for SubscriptionTracker "update_submission_metrics() could log an error or trigger some kind of notification when limits are exceeded
    create one SubscriptionTracker for all existing accounts + create a LEGACY plan?
    if at some point a plan does not last 1 year, renew_subscription() should receive start and end date"
    
    Account "1" *-- "1" SubscriptionTracker
    

    class Subscription {
        id : int
        created_at : datetime
        updated_at : datetime
        created_by : User
        updated_by : User
        start_date : date
        expiration_date : date
        payment_id : str
        payment_provider : str
        admin : User
        status : enum
        ---
        ACTIVE
        EXPIRED
        CANCELLED
        PLANNED
    }
    note for Subscription "payment data could be stored on its own if required, it could be interesting if Stripe is not the only provider
    a cron should update status every night
    status should be a nested enum
    we should probably have logs on this class"
    
    SubscriptionTracker "1" -- "0..n" Subscription : tracks >
    
    class SubscriptionPlan { 
        id : int
        max_submissions : int
        max_disk_size_mb : float
        max_projects : int
        name : enum
        ---
        FREE
        STANDARD
        PRO
        ADVANCED
        CUSTOM
        LEGACY ?
    }
    note for SubscriptionPlan "name should be a nested enum
    create a migration file to create all plans"

    Subscription "0..n" -- "1" SubscriptionPlan : has >
```

## API

Based on the use cases and the data model, we will probably need to create a new API endpoint: `/api/subscriptions/`

It's not clear yet how we will interact with that endpoint since there is currently no information about the stripe & hubspot interactions (polling? webhook that receives notifications? something else?)

I suggest that we:
- don't create subscriptions "directly" through the API by passing its parameters like any other object
- create instead subscriptions through a payment ID, we check the payment provider API to get some confirmation/information and create the subscription based on that
- have a FREE payment plan as default
