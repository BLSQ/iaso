*********
HAT Cases
*********

Cases
=====

This page shows the complete list of participants/cases registered in the dashboard
and imported via the different methods.

The data are presented as a paginated table. It can be filtered and ordered by different fields.
Depending on the user permissions the page displays more or less detailed info and even the option
to export the current dataset [e]_.

.. seealso:: `Importing and exporting data <../import_export/index.html>`__
             section or :class:`hat.cases.models.CaseAbstract`
             for more information on fields and also
             :class:`django.contrib.auth.models.User` on access level.


Filter options:

- Location: *Zone de santé -> Aire de santé -> Village*
- Document date: *since -- till*
- Internal ID
- Full name *name, prename, surname* [f]_
- Suspect case *yes/no*
- Screening test result
- Confirmation test result
- Source
- Device

Order options:

- Location (zone de santé, aire de santé, village)
- Document date
- Full name (name, prename, lastname) [f]_


.. [f] only available with full view permission
.. [e] only available with export permission


Analysis of cases
=================

This page presents the same data as above but aggregated by the indicated properties.

Filter options:

- Location: *Zone de santé -> Aire de santé -> Village*
- Document date: *since -- till*
- Source
- Device

Group by:

- Year (document date)
- Month (document date)
- Day of month (document date)
- Zone de santé
- Aire de santé
- Village
- Source
- Device

Aggregated data:

- Document date interval (from, to)
- Number of participants
- Number of HAT suspect cases
- Number of HAT confirmed cases


Reconciliation
==============

This page displays the detected potential duplicates by the nightly task
:func:`hat.tasks.jobs.duplicates_task`.

In the detailed view **“Compare”**, it's possible to confirm the match **“Merge”**,
will merge “Case 2” into “Case 1” and remove “Case 2” from the list,
or to mark them as *false positive* **“Ignore”**, next executions will ignore them.
