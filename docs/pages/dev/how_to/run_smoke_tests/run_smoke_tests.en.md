# Running smoke tests

## Table of Contents

- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
  - [Environment variables](#environment-variables)
  - [Variable description](#variable-description)
- [Running smoke tests](#running-smoke-tests)
  - [Run all tests](#1-run-all-tests)
  - [Run only health tests](#2-run-only-health-tests)
  - [Run only polio dashboard smoke tests](#3-run-only-polio-dashboard-smoke-tests)
  - [Commands summary](#4-commands-summary)
  
## Prerequisites

Make sure you have the following installed:

* Node.js (v16 or higher recommended)
* npm or yarn

Install npm packages. From the root folder (where `package.json` is located) 
```shell
npm ci
```

Install global playwright dependency:

```shell 
npx playwright install
```

## Configuration

Create a `.env.smoke` file based on the provided template.

From the project root: 
```shell
cp .env.smoke.template .env.smoke
```

### Environment variables

```
LOGIN_PASSWORD=
LOGIN_USERNAME=
GIT_TAG=
SAVE_SMOKE_TEST_SCREENSHOT=
SMOKE_TEST_MONITOR_CONSOLE_ERRORS=
HEALTH_ENV=
```

### Variable description

- **`LOGIN_USERNAME`** *(string)*  
  Username used by smoke tests to authenticate.

- **`LOGIN_PASSWORD`** *(string)*  
  Password used by smoke tests to authenticate.

- **`GIT_TAG`** *(string)*  
  Git tag expected by health check endpoints to verify the deployed version.

- **`SAVE_SMOKE_TEST_SCREENSHOT`** *(boolean, default: `false`)*  
  When enabled, smoke tests will capture and store screenshots (useful for debugging, as Playwright already captures screenshots automatically on test failures).

- **`SMOKE_TEST_MONITOR_CONSOLE_ERRORS`** *(boolean, default: `false`)*  
  When enabled, tests will fail if any `console.error` is detected in the browser.

- **`HEALTH_ENV`** *(string, comma-separated)*  
  List of environments to run health checks against. If not provided, all environments will be checked by default.

  Supported values:
  - `prod` → https://iaso.bluesquare.org
  - `pathways` → https://collect.projectpathways.org/
  - `playground` → https://iaso-playground.bluesquare.org
  - `campaigns` → https://www.poliooutbreaks.com/
  - `iaso-demo` → https://demo.openiaso.com

  

## Running smoke tests

### 1. Run all tests

```shell
npm run test:smoke
```

### 2. Run only health tests

These tests verify that the correct `GIT_TAG` is deployed by checking the `/health` endpoints of the environments defined in `HEALTH_ENV`.

```shell
npm run test:smoke:healthcheck
```


### 3. Run only polio dashboard smoke tests

Those tests will check that the polio dashboards are working correctly:

```shell
npm run test:smoke:polio-dashboards
```

The polio dashboards checked are the following:

* https://staging.poliooutbreaks.com/dashboard/polio/embeddedCalendar/campaignType/polio/
* https://staging.poliooutbreaks.com/dashboard/polio/embeddedVaccineRepository/
* https://staging.poliooutbreaks.com/dashboard/polio/embeddedVaccineStock/
* https://staging.poliooutbreaks.com/dashboard/polio/embeddedLqasCountry/
* https://staging.poliooutbreaks.com/dashboard/polio/embeddedLqasMap/

### 4. Commands summary

```bash
npm run test:smoke                     # Run all smoke tests
npm run test:smoke:healthcheck        # Run health checks only
npm run test:smoke:polio-dashboards   # Run dashboard tests only
```





