# Modules

IASO is organized according to Modules, which are groups of functionalities that can be activated depending on the use case to cover. Here are the Modules available in IASO:

## Data collection - Forms

Create and upload data collection forms using the widely known XLS form format. Forms are versioned, so every time a new version is created, the previous one stays available in the system. Submissions sent from the mobile application can be validated from the web, and data collection completeness can be monitored per organization unit, with drill-down to identify where issues happen.

## Change requests

A core Georegistry feature that keeps geographic data up to date. From the mobile application, users can submit change requests to an organization unit - including the creation of a brand-new one. Once submitted, the request appears on the web for a manager to review, shown side by side with the previous version so what changed is easy to spot.

Which organization unit fields are open to change requests (Name, Organization unit type, Parent, Group, GPS coordinates, opening and closing date, or whether users can create new organization units at all) is configurable ahead of data collection from the IASO web platform.

Change requests also support **reference forms**: a specific XLS form can be flagged as the reference form for an organization unit type, letting you attach fully custom "data attributes" to organization units - typically used for things like population figures or equipment inventories.

## Completeness per Period

Used for Performance-Based Financing (PBF) schemes, which IASO also supports as a data collection tool.

## Validation workflow

Enables "cascade validation" of submitted forms. Data managers define which user roles are responsible for approving data at each level of the hierarchy - for example, a "district manager" role approves first, then "region manager", then "country manager". The number of levels and who approves at each one is entirely configurable to match the hierarchy needed.

## Entities

Entities are items that can move from one geography to another - a person, a pallet of goods, or anything else worth tracking over time. They can be created from the mobile application and then managed from the web.

- Find likely duplicate entities from the web interface and decide whether to merge them
- Assign **workflows** to entity types, so that specific data collection forms open automatically depending on answers already given

## External storage

Lets IASO work with NFC cards as a storage medium, enabling entity data to be read from and written to a physical card in the field.

## Planning

Using a dynamic, map-based interface, data managers assign specific places to specific users, with a defined timeframe and one or more data collection forms. Field users then see their assigned "missions" on the mobile application and can navigate directly to the points where they need to collect data.

## Stock management

Tracks quantities of items available at organization unit level, based on stock-related questions built into data collection forms. Every "plus" or "minus" movement of an item at an organization unit is recorded, and the mobile application shows a real-time view of how many items remain at a given location.

## Payments

Linked to change requests. Based on the change requests a manager has approved, users can generate payment lots and download an Excel file summarizing, per user, how many approved change requests they're owed payment for.

## Form AI

Lets users create or edit data collection forms with AI as an assistant, rather than building the XLS form by hand.

## DHIS2 mapping

Activated when IASO is used alongside DHIS2, the most widely used open-source Health Management Information System. IASO's integration with DHIS2 is bi-directional: geographic data can be imported from DHIS2, then IASO's advanced geospatial tools take over for field data collection, and the updated data is sent back to DHIS2.

## Embedded links

Lets users embed external links - such as dashboards - directly into their IASO account, each with its own dedicated, personalized URL slug. IASO's user management (per user or via user roles) controls access to these embedded links, which support raw HTML, plain text, iframes, and Superset dashboards.
