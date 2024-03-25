## Welcome to the documentation of IASO

IASO is an innovative, open-source, bilingual (EN/FR) data collection platform with advanced geospatial features to plan, monitor and evaluate health, environmental or social programmes in low- and middle-income settings (LMICs). IASO is recognized as a Digital Public Good by the Digital Public Good Alliance and listed as a Digital Square Software Global Good, a testament to its proven impact.

IASO comprises:
- a **web dashboard** - intended for supervisors to organize data collection and geographical data management
- a **mobile application** that also works **offline** - intended to field users to fill out forms and send data when network is available
- a **matching and scripting interface** to analyze, compare and merge several geographic data sources
- a bi-directional **integration with DHIS2**, the widely used HMIS in LMICs

In terms of features, IASO can be summarized around **three main components** which are interconnected and expand the powers of one another:

-  Geospatial data management (Georegistry)
    -  Manage multiple master lists of organizational units (e.g. health areas, districts, facilities, or schools) including their GPS coordinates and boundaries
    -  Keep track of changes made to the organization units
    -   Map multiple geographic data sources
    -   Propose changes to org units from IASO mobile application and validate them on the web

- Structured data collection
    -   Create data collection forms using the widely known XLS form format and upload them to IASO
    -   Link your form to one or several organization unit type (e.g. National/Regional/District/Health facility) to geo-structure your data collection
    -   Keep track of changes with versioning of your data collection forms
    -   Validate from the web all data collection form submissions sent from IASO mobile application
    -   Monitor data collection completeness per organization unit level and drill-down to identify where issues happen

-   Geo-enabled Microplanning
    - Manage teams of users and teams of teams
    - Assign data collection duties to teams and users using a map interface
    - Create plannings with a scope, a time span, and one or several data collection form(s)

The platform has been implemented in Benin, Burkina Faso, Burundi, Cameroon, Central African Republic, the Democratic Republic of Congo, Haiti, Ivory Coast, Mali, Niger, Nigeria and Uganda. It is the official georegistry in Burkina Faso since 2023. IASO has also been implemented at regional level (AFRO region) in support to the Global Polio Eradication Initiative for its geospatial and health facility registries capabilities.


### Technical stack

IASO is made of a white labeled Android application using Java/Kotlin, reusing large parts of the ODK projects, and a web platform programmed using Python/GeoDjango on top of PostGIS. Frontend is mainly React/Leaflet. The API is implemented via Django rest framework, all data is stored in Postgresql or the media/ directory. One of the aims is the ease of integration with other platforms. We already have csv and geopackage imports and exports and target easy integration with OSM.

The companion mobile app for Android allow submitting forms and creating org unit.

Forms can also be filled in a web interface via the Enketo companion service. Both Iaso and Enketo need to be configured to work together. It is possible to run an Enketo service locally.
