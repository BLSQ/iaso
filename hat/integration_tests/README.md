Sense HAT Integration tests:
======

Selenium tests, always running on SauceLabs for now

## Setup

1. Set up your environment:
   ```
   export SAUCE_USERNAME=ehealth
   export SAUCE_ACCESS_KEY=(find in lastpass)
   ```

   It's not the password, but the Access Key that you'll need!

2. [Download Sauce Connect here](https://wiki.saucelabs.com/display/DOCS/Setting+Up+Sauce+Connect)

## Running

1. In one terminal, start Sauce tunnel: `[path-to-sauce-connect]/bin/sc` - you can leave this running the entire time you're working with tests

2. `docker-compose run -p 8081:8081 hat test_integration`

It's important that you expose the port, it's a different one than the main port so tests can run at the same time as the main app.

## Fixtures

Fixtures can be loaded via django testcase fixtures. There are a few users included already, they are explained in the [main README](https://github.com/eHealthAfrica/sense-hat#fixtures). Creating new fixtures can be done with a combination of adding the data you want to the db, `docker-compose run web manage dumpdata --natural-foreign` and manual filtering. I would explain that better if i could.

## Writing tests

Start in `hat/integration_tests/tests/test_integration.py`. Add a test method to the class defined there. We could break that out as a base class some time if we need to. Remember the holy integration test rules:

1. Always select elements via data-qa attributes

2. Use [explicit waits](http://selenium-python.readthedocs.io/waits.html#explicit-waits) to wait for elements to appear
