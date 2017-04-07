***********
SQL queries
***********

Sometimes the Django ORM models are not enough or maybe too complicated for
a certain type of queries and it's preferible to use raw SQL sentences.

For those cases we define here the SQL queries.

The python library used to handle the queries is
`Snaql <https://github.com/semirook/snaql>`__


Queries
=======


export
------

export
~~~~~~

``psql \copy`` command to dump the data locally to a file.


filters
-------

list_of_field_values
~~~~~~~~~~~~~~~~~~~~

Returns the list of available values per ``field``.
It's used to fulfill `select` components.


duplicates
----------

prepare
~~~~~~~

Creates the function and view needed to detect similarities between
:class:`hat.cases.models.Case` entries.

makepairs
~~~~~~~~~

Executes the SQL sentence that detects similarities between
:class:`hat.cases.models.Case` entries.
Inserts those entries in :class:`hat.cases.models.DuplicatesPair` table,
excluding the pairs in :class:`hat.cases.models.IgnoredPair` table.


stats
-----

cases_over_time
~~~~~~~~~~~~~~~

Queries the :class:`hat.cases.models.CaseView` table and joins it with a
dynamic and temporal view that generates all the interval steps between two dates.
This allows to get the figures (even zeros) in a certain period split by the
indicated interval type. In our case all the tested participants per month day.


population_coverage
~~~~~~~~~~~~~~~~~~~

Queries the :class:`hat.cases.models.CaseView` table and joins it with the
:class:`hat.cases.models.Location` table. In our case calculates the
tested participants and filters these figures with the villages with population.


microplanning
-------------

data_by_location
~~~~~~~~~~~~~~~~

Queries the :class:`hat.cases.models.Location` table that it's used to
plot all the villages in a map-based interface. In case of the *highlighted*
option is also requested; those entries are joined with their HAT confirmed cases
(taken from :class:`hat.cases.models.CaseView` table).


prepare_db
----------

Creates the views that are used within the Dashboard to ease most of the common
queries;

The views are:

- :class:`hat.cases.models.CaseView`.

- :class:`hat.sync.models.DeviceDBView`.

- **hat_event_view** -- *internal* -- used in
  reimport :func:`hat.import_export.reimport.reimport`.

  .. seealso:: `event_log & migration files <#event-log-migration-files>`__


The process is divided into two steps:

1. It's executed before any migration step and drops all the views already created
   to avoid any conflicts with data model changes.

2. It's executed after all migration steps and creates the views based on the
   updated data models.


event_log & migration files
---------------------------

Prepares/creates all the tables and SQL statements needed to keep track of all
the actions that could alter the :class:`hat.cases.models.Case` state.

Due to the complexity of these tables instead of using Django ORM models the
app uses raw SQL.


migration_0001.run
~~~~~~~~~~~~~~~~~~

Creates the following tables:

- **hat_event** -- keeps track of every executed action that alters
  :class:`hat.cases.models.Case` state.

  .. note~~ this is the master table.

- **hat_import_cases_file_event** -- keeps track of every imported case file.

- **hat_import_reconciled_file_event** -- keeps track of every imported reconciled file.

- **hat_merge_cases_event** -- keeps track of every duplicate merge action.

- **hat_sync_cases_event** -- keeps track of every sync device action.


event_log.cases_file_by_hash
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Retrieves the case files by hash. The file hash is unique.


event_log.reconciled_file_by_hash
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Retrieves the reconciled files by hash. The file hash is unique.


event_log.insert_event
~~~~~~~~~~~~~~~~~~~~~~

Inserts an event entry in **hat_event** table and in its secondary table
depending on the ``details_table`` value.


Adding new queries or modifying the existing ones
=================================================

Unfortunately, for now you need to restart the container after adding or
changing the queries.

.. code:: shell

    docker-compose restart hat
