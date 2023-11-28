# Interoperability roadmap 2023-2024

### Introduction

Iaso, whose name was taken from the name of a
Greek goddess for health, has initially been developed to support
national health programmes in their data collection and organization of
geographical information in remote and low connectivity areas. Since
then, it has also been used in other fields, such as education and
environmental projects.

Iaso builds on three essential concepts users, forms (in XLSForm format)
and org units (e.g. districts and facilities) with a focus on
structuring data collection along geographic lines to allow for
splitting responsibility geographically, as is commonly done in health
programs. This allows to decentralize monitoring, validation and team
management. It also allows to have out of the box completeness reporting
for data collection.

Iaso has been recognized as a **Global Good for Health** by Digital
Square. As such, Bluesquare acknowledges the importance of making Iaso
as interoperable as possible in order to facilitate data exchange within
the **global digital health ecosystem** such as the **Open Health
Information Exchange (OpenHIE) community**.

### Open standards already implemented

The below below standard technologies are already being used by Iaso
today:

-   Data collection: [XLSForm](https://xlsform.org/), CSV

-   Geographical data: [geopackage](http://www.geopackage.org/)

Iaso data collection can be done through forms in the common **XLSForm
format** used for example by ODK, and allows to import and export data
to **DHIS2** (thanks to a user-friendly mapping interface), which is not
per se using open formats in general, but is a de facto standard in some
health topics, DHIS2 being probably the most installed open source
health information management system.

Iaso allows imports and exports of geographical data through the
geopackage format
([<u>http://www.geopackage.org/</u>](http://www.geopackage.org/)) which
is the relatively new golden standard for Geographical Information
Systems.

### Interoperability roadmap

**1. Short-term (by end of 2023)**

- **DHIS2 Tracker data import/export**

Recently, we implemented case management features in Iaso, which is
mainly the possibility to collect and store data about individuals. One
goal will be to further develop the integration between Iaso and DHIS2
Tracker, to allow the import and export of data linked to individuals.

- **FHIR**

In the same context as above, Bluesquare would ensure that Iaso is
compatible with the FHIR standard for health care data exchange. That
said, Iaso is a generic data collection tool, and consequently we can’t
enforce that collected data always uses a predefined set of fields.
Consequently, support of FHIR for case management would be made on a
project basis, and where Bluesquare could help is by providing
documentation of how to implement some parts of the **FHIR** standard.

On the other hand, Iaso is a very complete facility list management
system and here, there is a very good opportunity to adopt **OHIE**
facility registry standards. This will be studied by the end of the year
and implemented if we can identify a project needing the feature.

**2. Long-term (end of 2023 and beyond)**

-  **Better sharing of documentation about Iaso**

Iaso’s code and general information is published on the dedicated Github
repository that you can find here:
[<u>https://github.com/BLSQ/iaso/wiki</u>](https://github.com/BLSQ/iaso/wiki)

Bluesquare has started to organize processes to ensure more easily
accessible documentation about Iaso, that will benefit the open source
health softwares community. An evolving user guide will be made
available on [https://readthedocs.org/](https://readthedocs.org/), together with more technical
documentation on new features. A high-level roadmap on next features
will also be published and maintained.

To facilitate interoperability, we are in the process of publishing the
api specification in the OpenAPI standard (the format used by the
Swagger tool).

-  **Microplanning**

Iaso is growing more and more to be a planning system, e.g. for
vaccination campaigns. We need to investigate if there are existing
standards (outside of calendar standards like caldav) , especially in
the OHIE specification that could be reused to expose our plannings to
external systems.

-  **Logistics**

There is a growing demand for Iaso to be able to handle logistics, in
order to monitor stocks of certain health-related or other supplies,
such as vaccines, mosquito nets in certain locations. If Iaso would
further develop features in this field, Bluesquare will make sure to
follow the openHIE “Logistics Management Information System (LMIS)” and
“Product Catalogue” components principles.
