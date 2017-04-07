***********
Maintenance
***********

This section is only accesible to **superusers**.


Stats
=====

Indicates and give view access to the most meaningful data models.

- **Events**
  -- These are the steps followed to arrive to the current data state.
  *A trace of every import or duplicate merge action*.


- **Transformed**
  -- Number of entries in :class:`hat.cases.models.Case`.


- **Duplicate matches**
  -- Number of entries in :class:`hat.cases.models.DuplicatesPair`.


- **Devices**
  -- Number of entries in :class:`hat.sync.models.DeviceDBView`.
  -- Devices detected within the cases or in the synced devices.


Actions
=======

- **Delete the transformed data.**
  -- Removes **ALL** the entries in :class:`hat.cases.models.Case`.


- **Delete the transformed data and reimport from raw.**
  -- Removes **ALL** the entries in :class:`hat.cases.models.Case` and
  executes the tracked **events** in the same chronological order they were
  previously sucessfully executed.


- **Import synced devices data.**
  -- Forces the sync import task.

  .. Note:: The task is executed every hour.


- **Rebuild the reconciliation duplicates list.**
  -- Forces the duplicates detection task.

  Due to all the different sources it's possible and probable that the same HAT case
  is contained in many files (encrypted backup, historial and even pharmacovigilance).
  The import process cannot always detect them and creates the pertinent new entries.
  This task tries to find similarities between records and returns a list of possible
  matches that could be ignored or merged.

  .. Note:: The task is executed every night at 02:00.


- **Download the events log as csv.**
  -- Creates a CSV file with the events and their logs (creations/updates/deletions).


- **Download the events tables database dump.**
  -- Creates a database dump with all the event tables.

  .. note: This file could be restored in other database/server.


- **Upload the events tables database dump.**
  -- Restores a database dump with the event tables. Replaces the current events.

  .. warning:: If this fails somewhere after the events have been deleted,
               the data are not recoverable.
