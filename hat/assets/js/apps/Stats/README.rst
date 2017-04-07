Stats
-----


Proportion of population screened
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- Participation rate.

- Number of participants registered.

- Total population of screened areas (estimate).


*The percentage of the target population of the screened areas for this time period.*

*The participation rate is calculated using only these villages with population.*

API Request:
  - Population coverage: :func:`hat.api.dataset_viewset.population_coverage`

Visual: *donut chart.*


Amount of people missing tests
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- Percentage of missing tests.

- Number of participants with a test result.

- Number of participants registered.


*The percentage of participants registered in the app who are missing test results.*

API Requests:
  - Cases over time: :func:`hat.api.dataset_viewset.cases_over_time`
  - Participants: :func:`hat.api.dataset_viewset.count_total`

Visual: *bar chart per date.*


Screening tests
~~~~~~~~~~~~~~~

- Percentage of HAT probable.

- Number of participants with a **POSITIVE** screening result.

- Number of participants with a **NEGATIVE** screening result.


*The percentage of participants tested who had a positive screening test (CATT or RDT).*

*Out of an overall total of participants registered.*

API Requests:
  - Cases over time: :func:`hat.api.dataset_viewset.cases_over_time`
  - Screened participants: :func:`hat.api.dataset_viewset.count_screened`

Visual: *bar chart per date.*


Confirmation tests
~~~~~~~~~~~~~~~~~~

- Percentage of HAT confirmed.

- Number of participants confirmed **POSITIVE** for HAT.

- Number of participants confirmed **NEGATIVE** for HAT.


*The percentage of participants tested who had a positive confirmation test
(PG, mAECT, CTC/WOO, or GE).*

*Out of an overall total of participants registered.*

API Requests:
  - Cases over time: :func:`hat.api.dataset_viewset.cases_over_time`
  - Confirmed participants: :func:`hat.api.dataset_viewset.count_confirmed`

Visual: *bar chart per date.*


Stage tests
~~~~~~~~~~~

- Number of participants HAT “Stage 1”.

- Number of participants HAT “Stage 2”.


*Out of an overall total of participants registered.*

API Requests:
  - Cases over time: :func:`hat.api.dataset_viewset.cases_over_time`
  - Participants with confirmed “Stage #” classification: :func:`hat.api.dataset_viewset.count_staging`

Visual: *bar chart per date.*


Technical notes
~~~~~~~~~~~~~~~

Chart tool: `Vega <https://vega.github.io/vega/>`__
