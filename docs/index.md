## Welcome to the documentation of Iaso

Iaso is a georegistry, data collection and planning web platform structured around trees of organization units (also known a master lists)

The main tasks it allows accomplishing are:

- Data collection using XLSForm forms linked to org units through a mobile application.
- Import, comparison and merging of multiple Org Units' trees, both through a web application and an API allowing manipulation through data science tools like Jupyter notebooks.
- Validation of received data for Org Units' trees and forms.
- Exports of the Org Units' trees and form data, either in csv, xlsx, GeoPackage or through an api. Exports to DHIS2 are also very well supported
- Planning of activities through a planning interface. The created plannings are then made available to end users through the mobile application.


### History

Iaso is a platform created to support geo-rich data collection efforts, mainly in public health in emerging countries. The key feature that it supports is that any survey is linked to an organizational unit that is part of a canonical hierarchy. Each one of these org. units can have a location and a territory. The mobile data collection tool can be used to enrich this hierarchy with additional GPS coordinates, names corrections, etc ... which can then be validated by officials of the organizations in question through the web dashboard. This leads to continuous improvements of the geographic references available through the routine activities already planned. e.g. locating and registering health facilities while investigating malaria cases.

The tool has been used in multiple data collection efforts, notably in the domain of Performance Based Financing of health services in D.R. Congo, Niger, Cameroon and Nigeria and is more and more used to compare multiple versions of official organisational hierarchies when a canonical one needs to be rebuilt (for example to rebuild a school map for DRC). To help for this type of project, we provide location selection interfaces, multiple levels of audits and an API open to data scientists for analysis and mass edits.

Iaso has been created by the company Bluesquare, specialised in software and services for public health, and has become open source under the MIT License in November 2020.

### Technical stack

Iaso is made of a white labeled Android application using Java/Kotlin, reusing large parts of the ODK projects, and a web platform programmed using Python/GeoDjango on top of PostGIS. Frontend is mainly React/Leaflet. The API is implemented via Django rest framework, all data is stored in Postgresql or the media/ directory. One of the aims is the ease of integration with other platforms. We already have csv and geopackage imports and exports and target easy integration with OSM.

The companion mobile app for Android allow submitting forms and creating org unit.

Forms can also be filled in a web interface via the Enketo companion service. Both Iaso and Enketo need to be configured to work together. It is possible to run an Enketo service locally.
