# Vaccine Management in IASO.

**Vaccine Stock Management & Supply Chain Documentation**

### Introduction

This document provides a simplified explanation of how the vaccine stock management and supply chain modules function in our backend system, focusing on how vaccine totals are calculated at various stages. This guide is intended for both technical and non-technical audiences to understand how vaccine supplies are managed from request to distribution.

The vaccine management system is split into two main modules: **Stock Management** and **Supply Chain**. The **Stock Management** module deals with tracking vaccines at warehouses, including incidents that might affect stock, while the **Supply Chain** module tracks the movement of vaccines from the time they are ordered until they arrive. Additionally, the system provides several **dashboard endpoints** that aggregate and display the relevant data, ensuring that stakeholders have an up-to-date overview of the vaccine inventory.

### Data Models and Structure

The system uses a variety of data models to store information about vaccines. Here are some of the key models:

1. **Vaccine Request Form**: This form holds the details of the vaccine requests made by countries or regions. It keeps track of all the related information such as the total number of vaccine doses requested, shipped, and received.

    - **Total Doses Shipped**: The total doses shipped are calculated by adding up all the doses from linked shipment records.
    - **Total Doses Received**: The total number of doses received is calculated by adding all doses listed in the arrival reports.

2. **Vaccine Pre-Alert**: This record indicates when a shipment of vaccines is on the way. It includes information such as the **number of doses shipped**, the **estimated time of arrival**, and **lot numbers**.

3. **Incident Reports**: Incidents that affect stock, such as **losses**, **returns**, or **breakages**, are recorded here. These incidents play a crucial role in updating stock counts.

4. **Destruction Reports and Outgoing Movements**: Additional models such as **Destruction Reports** and **Outgoing Stock Movements** are used to manage vaccines that are discarded or moved out of storage for distribution. These records impact the overall stock and are essential for tracking reductions in stock.

### Stock Management Module: Tracking Inventory

The **Stock Management Module** is responsible for managing vaccine stocks after they have been received into storage, such as at warehouses or distribution centers.

-   **Tracking Totals in Stock**: To track the current stock, the system records all incoming and outgoing vaccine doses and uses these to calculate current totals.

    -   **Usable Stock**: The number of doses available for use is tracked by counting all **received vials** minus any losses or other incident-related adjustments.
    -   **Unusable Stock**: This includes any doses that are reported as expired, broken, or lost due to other incidents. The system sums up these unusable doses and keeps them separate from the usable stock.

-   **Incident Reports and Their Impact**: Incidents such as broken vials or expired vaccines reduce the total available stock. The system maintains details of every incident, such as the **number of unusable vials** and their impact on the overall vaccine inventory.

    -   For example, if there is a report of 50 broken vials, and each vial contains 10 doses, the system calculates **500 unusable doses** and removes them from the usable stock.

-   **Dashboard Endpoints for Stock Data**: The system also includes endpoints that are used to display stock data on dashboards. These endpoints provide summaries, such as **stock-in-hand** and **incidents summary**, allowing stakeholders to quickly understand the available stock and recent incidents affecting vaccine inventory.

    -   **Caching**: To improve the performance of these dashboard views, the results are cached for one hour. This ensures that frequently accessed data is quickly available while still reflecting recent changes.

### Supply Chain Module: Managing the Flow of Vaccines

The **Supply Chain Module** tracks vaccines as they are shipped to their final destinations. This includes everything from the initial shipment notification (pre-alert) to when the vaccines arrive and are confirmed.

-   **Pre-Alerts**: A **pre-alert** is a record that a shipment is on its way. This helps stakeholders be prepared to receive the vaccines. It includes details such as the **estimated arrival time** and **number of doses**.

    -   The pre-alert information is used to keep track of vaccines in transit and estimate future availability.

-   **Arrival Reports**: When vaccines arrive at their destination, an **arrival report** is created to confirm how many doses actually arrived.

    -   If any discrepancy exists between the **doses shipped** (in the pre-alert) and the **doses received** (in the arrival report), the system calculates the difference and marks it for review.

-   **Dashboard Endpoints for Supply Chain Data**: Several endpoints are used to support dashboards displaying supply chain metrics. These endpoints provide data on **shipment status**, **arrival times**, and **discrepancies**. By aggregating data from **pre-alerts** and **arrival reports**, stakeholders can view up-to-date shipment statuses and quickly identify any issues in the supply chain.

### Example Calculation: From Shipment to Stock

To make things clearer, let's walk through a typical scenario involving all key models:

1. **Vaccine Request Form**: A country submits a request for **10,000 doses** of vaccine using a Vaccine Request Form.
2. **Pre-Alert**: The users receive a paper pre-alert which they encode into the system, indicating that 10,000 doses are being shipped.&#x20;
3. **Arrival Report**: On arrival, an **arrival report** is created that notes that only **9,800 doses** have been received. The system automatically calculates that there is a **shortfall of 200 doses**, which needs to be reconciled.
4. **Incident Report**: If some of the received vials are found to be damaged, say **100 vials** containing **10 doses each**, these are marked as unusable in an **Incident Report**, resulting in **1,000 doses** being deducted from the usable stock.
5. **Outgoing Stock (FormA)**: After checking the stock, **Outgoing Stock Movements (FormA)** are used to distribute \*\*1,000 doses\*\* to health facilities. This is recorded to reflect the movement of vaccines out of the central storage.
6. **Destruction Report**: The **Destruction Report** records that **200 vials** expired during storage, which further impacts the usable stock.
7. **Final Stock Calculation**: Initially shipped doses were **10,000**. After arrival, usable doses were noted to be **9,800**. After adjusting for incidents (**1,000 unusable doses**) and accounting for outgoing movements and destructions, the total usable doses are now **7,800**.

### Summary

-   **Stock Management** handles everything related to vaccines in storage, tracking usable and unusable doses.
-   **Supply Chain** manages vaccine movement, from shipment notifications (pre-alerts) to confirming receipt (arrival reports).
-   **Dashboard Endpoints** provide stakeholders with visual and data-based summaries of vaccine stocks and supply chain statuses.
-   Totals are calculated by **adding received doses** and **subtracting doses lost due to incidents** or discrepancies in arrival.

These processes ensure that all stakeholders have an accurate picture of the vaccine inventory at every stage, from initial shipment to final distribution.

# Overview of the related DB models

```mermaid
classDiagram
    class Account {
        +String name
    }
    class Campaign {
        +UUID id
        +String obr_name
        +Boolean separate_scopes_per_round
        +ForeignKey account
        +ForeignKey initial_org_unit
        +ForeignKey country
        +ManyToManyField campaign_types
        +OneToManyField rounds
        +OneToManyField scopes
    }

    class Round {
        +Integer number
        +ForeignKey campaign
        +OneToManyField scopes
    }

    class RoundScope {
        +ForeignKey round
        +CharField vaccine
    }

    class CampaignScope {
        +ForeignKey campaign
        +CharField vaccine
    }

    class VaccineRequestForm {
        +ForeignKey campaign
        +CharField vaccine_type
        +ManyToManyField rounds
    }

    class VaccinePreAlert {
        +ForeignKey request_form
        +Integer doses_shipped
    }

    class VaccineArrivalReport {
        +ForeignKey request_form
        +Integer doses_received
    }

    class VaccineStock {
        +ForeignKey account
        +ForeignKey country
        +CharField vaccine
    }

    class OutgoingStockMovement {
        +ForeignKey campaign
        +ForeignKey vaccine_stock
    }

    class DestructionReport {
        +ForeignKey vaccine_stock
    }

    class IncidentReport {
        +ForeignKey vaccine_stock
    }

    Campaign --> Round : has
    Account --> Campaign : has
    Account --> VaccineStock : has
    Round --> RoundScope : has
    Campaign --> CampaignScope : has
    Campaign --> VaccineRequestForm : has
    Campaign --> OutgoingStockMovement : has
    VaccineRequestForm --> Round : relates to
    VaccineRequestForm --> VaccinePreAlert : has
    VaccineRequestForm --> VaccineArrivalReport : has
    VaccineStock --> OutgoingStockMovement : has
    VaccineStock --> DestructionReport : has
    VaccineStock --> IncidentReport : has
```
