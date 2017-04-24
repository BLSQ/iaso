=====================================
Welcome to Sense HAT's documentation!
=====================================

------------------------------------
HAT -- Human African Trypanosomiasis
------------------------------------

HAT stands for **Human African Trypanosomiasis**, also known as sleeping sickness.
This disease is caused by the bite of the *tsetse* fly, that transmits a
*trypanosome* (a form of parasite).

The trypanosomes are first in the blood and cause mild symptoms like headaches,
fatigue or inflamed glands. People in this **first stage** of the disease rarely
seek treatment, but can transmit the disease to others through the bite of the
fly (the vector of the disease) and should be identified and treated. If they
are not they will progress into the **second stage** of the disease and the
trypanosomes will get into the liquid in the brain and spine and start
causing more severe symptoms and eventually death.

HAT affects mostly poor populations living in remote rural areas of Africa.
In order to identify and treat new cases and reduce the transmission with the
goal of **total elimination in 2020** in mind, mobile teams travel to villages
at risk to mass test populations.


-----------------
Problem Statement
-----------------

**Decentralised document management**.

Analysis for the case finding data sent by the mobile teams on paper and monitoring
of their activities is based on paper and then manually transferred to different
spreadsheets and text documents, using several different tools and using different
formats. Data processes and workflows are still largely manual, labor-intensive,
time-consuming, and are not standardized. Our goal is to improve reporting of HAT
activities and events, supporting decision making for PNLTHA, ITM and their
partners to improve the quality and reach of HAT elimination activities.


The aim of the Sense HAT dashboard is to:

- Replace paper-based data entry with digital data entry.
- Speed up the labor-intensive data processes and provide timely access to
  reports based on the collected data.
- Provide a secure, easy to use pipeline to transfer these data from point of
  collection to the database.

This will solve the following issues:

- Eliminate the need to use insecure file transfer processes, e.g. email.
- Slow report generation - which currently takes months or even years.


----------------
Project Overview
----------------

For the teams engaged in the surveillance and treatment of Human African
Trypanosomiasis (HAT) in the Democratic Republic of Congo (DRC).

**Sense HAT** is a solution formed by:

- A historical data warehouse.

- **Sense HAT Mobile application** -- An offline-first mobile application for mobile
  teams to register population screened, outcome of clinical and parasitological
  diagnostic tests.

- **Sense HAT Dashboard** -- An online dashboard for coordinators and supervisors
  to analyse data and data quality, overview results, and monitor team performance.


------------
How it works
------------

.. toctree::
   :maxdepth: 2

   Introduction & Settings <introduction>
   Integration tests <integration_tests/README>
   Frontend assets <assets/README>


---------------
Technical notes
---------------

.. toctree::
   :maxdepth: 2

   Architecture diagram <diagram.rst>

   Data sources <model>
   Importing and exporting data <import_export/index>
   Sync devices data <sync/index>

   Tasks <tasks/index>
   SQL queries <queries/index>
   API <api/index>


---------
Dashboard
---------

.. toctree::
   :maxdepth: 2

   Microplanning tool <assets/js/apps/Microplanning/README>
   Stats  <assets/js/apps/Stats/README>
   Monthly report <assets/js/apps/MonthlyReport/README>
   HAT Cases <cases/index>
   Maintenance <maintenance/index>


------
Credit
------

Brought to you by `eHealth Africa <http://ehealthafrica.org/>`__
— *good tech for hard places*.


-------
License
-------

`Apache-2.0 <https://www.apache.org/licenses/LICENSE-2.0>`__

Licensed under the Apache License, Version 2.0 (the **“License”**);
you may not use this file except in compliance with the **License**.

You may obtain a copy of the **License** at
http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed
under the **License** is distributed on an **“AS IS”** BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

See the **License** for the specific language governing permissions and
limitations under the **License**.
