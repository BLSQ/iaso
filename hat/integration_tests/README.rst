*****************
Integration tests
*****************

Selenium tests, always running on SauceLabs for now.

Setup
=====

#. Set up your environment:

   .. code:: bash

       export SAUCE_USERNAME=...
       export SAUCE_ACCESS_KEY=...


   It's not the password, but the Access Key that you'll need!

#. `Download Sauce Connect here <https://wiki.saucelabs.com/display/DOCS/Setting+Up+Sauce+Connect>`__


Running
=======

#. In one terminal, start Sauce tunnel:

   .. code:: bash

      [path-to-sauce-connect]/bin/sc

   You can leave this running the entire time you're working with tests.

#. Run the tests:

   .. code:: bash

        docker-compose run -p 8081:8081 hat test_integration

   It's important that the tests port is a different one than the main port
   so tests can run at the same time as the main app.


Fixtures
--------

Fixtures can be loaded via django testcase fixtures. There are a few users included already.

Creating new fixtures can be done with a combination of adding the data you want to the database,

.. code::

    docker-compose run hat manage dumpdata --natural-foreign

and manual filtering.


Writing tests
=============

Start in ``hat/integration_tests/tests/test_integration.py``.

Add a test method to the class defined there.

Remember the basic integration test rules:

#. Always select elements via ``data-qa`` attributes.

#. Use `explicit waits <http://selenium-python.readthedocs.io/waits.html#explicit-waits>`__
   to wait for elements to appear.
