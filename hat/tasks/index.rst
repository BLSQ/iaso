*****
Tasks
*****

All the process that could take more than a couple of seconds are executed as a
task to avoid possible timeouts.

In this category enter:

- all the import/export actions (timeout: 15 minutes)

- the reimport process (timeout: 2 hours)

- events dump actions (timeout: 30 minutes)

- the scheduled activities:

    * duplicates detection (scheduled: daily at 2:00, timeout: 15 minutes)

    * synced devices import (scheduled: hourly at o'clock, timeout: 15 minutes)


Jobs
====

.. automodule :: hat.tasks.jobs
   :members:
