Monthly Report
--------------

Monthly statistics from active screening using the HAT mobile application.


Campaign activity
~~~~~~~~~~~~~~~~~

- Villages visited.

- “Aires de santé” visited.

- Participants tested.

- Average number of participants screened per day.
  -- *Participants with a screening test.*

- Data collection period.
  -- *Taken from date of first entry and date of last entry*

- Number of participants tested on each day.
  -- *Bar chart.*

API Requests:
  - Screening sessions: :func:`hat.api.dataset_viewset.campaign_meta`
  - Tests per day: :func:`hat.api.dataset_viewset.tested_per_day`
  - Screened participants: :func:`hat.api.dataset_viewset.count_screened`


Case information
~~~~~~~~~~~~~~~~

- Participants missing confirmation tests.
  -- *Participants with a positive screening test, but without a confirmation test.*

- Confirmed cases.
  -- *Participants with a positive confirmation test.*

- Suspected cases.
  -- *Participants with a positive screening test.*

- Negative cases.
  -- *Participants with a negative confirmation test.*

API Requests:
  - Screened participants: :func:`hat.api.dataset_viewset.count_screened`
  - Confirmed participants: :func:`hat.api.dataset_viewset.count_confirmed`


Missing tests
~~~~~~~~~~~~~

- Participants missing test results.
  -- *Participants’ details registered but no test result was added.*

API Request:
  - Participants: :func:`hat.api.dataset_viewset.count_total`


Technical notes
~~~~~~~~~~~~~~~

Chart tool: `Vega <https://vega.github.io/vega/>`__
