****************************
Importing and exporting data
****************************

The ``import_export`` module can import cases and location data and export cases data.
For cases, it contains the code to extract the data from different sources,
transform them into a common schema and load them into the database.

Current supported sources are:

- MS Access historic cases MDB files
- Pharmacovigilance cases MDB files
- Sense HAT Mobile App encrypted backup files
- Sense HAT Mobile App data that were synced to couchdb
- Reconciled cases CSV/XLSX files
- DBF files with location data

Importing cases
===============

.. automodule:: hat.import_export.import_cases
   :members: import_cases_file

.. automodule:: hat.import_export.import_synced
   :members: import_synced_devices

.. automodule:: hat.import_export.import_reconciled
   :members: import_reconciled_file

Importing locations
===================

.. automodule:: hat.import_export.import_locations
   :members:

Exporting cases
===============

.. automodule:: hat.import_export.export_csv
   :members:

Extraction, transformation and loading
======================================

.. automodule:: hat.import_export.extract
   :members:

.. automodule:: hat.import_export.mapping

.. automodule:: hat.import_export.load
   :members:

Reimporting again
=================

.. automodule:: hat.import_export.dump
   :members:

.. automodule:: hat.import_export.reimport
   :members:
