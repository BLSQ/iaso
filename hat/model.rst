************
Data sources
************

The data fit into two broad classifications:

- **Case data** -- data about individual cases and participants tested, useful for
  those studying the spread of the disease.
- **Activities data** -- data about the performance of teams conducting testing,
  useful for management purposes to improve the performance analytics.

Case data sources for analysis are:

- The HAT Historical Data forms (Format: Microsoft Access).
- Pharmacovigilance (Format: Microsoft Access).
- Sense HAT application data from the mobile application.

All of these data are uploaded to the data warehouse for analysis.

.. note:: Activities data are derived from metadata in the mobile application.


Case data
=========

**Current status**: Case data are currently managed on paper forms called *Declaration
Forms*. They are used by the Mobile Units when doing mass screenings and/or
confirmation tests for suspect cases around the villages (Active Case Finding).
A Declaration Form is filled in for every new Confirmed Case (Case).

**Sense HAT application data**: Since May 2016, certain Mobile Teams use the Sense
HAT mobile application instead of the Declaration Form. Every person tested
(Participant) is registered with their personal details and test results.
These data are uploaded to a data warehouse, where it can be accessed by the
dashboard to inform reports and graphs.

**The HAT Historical Data forms**: In addition to the data from the Sense HAT
Mobile application some of the Declaration Forms are being added to the data
warehouse. A team of data agents has been entering the data in these forms in
Access forms, and they are being incorporated - first all the existing ones and
then, as an ongoing process, for forms that continue being found and digitized.

**Pharmacovigilance**: A previous project had a research database with information
coming from Declaration Forms and Treatment forms (used by the health facilities
where HAT cases are treated). This has also been added to the data warehouse and
is available to build historic analysis.


Activities data
===============

Activities data refer to metadata collected by the Sense HAT Mobile application
including:

- Time of data collection
- Location of data collection
- Number of participants tested


Django ORM models
=================

Case
----

.. autoclass:: hat.cases.models.CaseAbstract
.. autoclass:: hat.cases.models.Case
.. autoclass:: hat.cases.models.CaseView

.. automodule:: hat.cases.filters
   :members:


Reconciliation
--------------

.. autoclass:: hat.cases.models.DuplicatesPair
.. autoclass:: hat.cases.models.IgnoredPair


Location
--------

.. autoclass:: hat.cases.models.Location


Sync
----

.. automodule:: hat.sync.models
   :members:


User
----

.. autoclass:: django.contrib.auth.models.User

   :ivar List[text] user_permissions:
    Choices:

      - **export**               -- Can export anonymized cases data.
      - **export_full**          -- Can export non anonymized cases data.
      - **import**               -- Can import cases data.
      - **import_locations**     -- Can import location data.
      - **import_reconciled**    -- Can import cases reconciliation data.
      - **reconcile_duplicates** -- Can reconcile duplicates.
      - **view**                 -- Can view anonymized cases data.
      - **view_full**            -- Can view non anonymized cases data.

.. automodule:: hat.users.models
   :members:

