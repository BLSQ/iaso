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

2. `docker-compose run -p 8080:8080 web test_integration`

It's important that you expose the port, that does not get read from the docker-compose file.
