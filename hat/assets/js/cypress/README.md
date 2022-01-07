Development environment
=======================

[Cypress documenation](https://docs.cypress.io/guides/overview/why-cypress)

Setup
-----

- Run `npm ci` to install it locally

- As the authentification flow is tested too, you should set environment variables in your .env file:
``` {.sourceCode .env}
    CYPRESS_USERNAME="username_to_use"
    CYPRESS_PASSWORD="password_to_use"
```
> This user can be a basic one without permissions, we will intercept profile call and override it for testing

- Application should run on the base url specified in the .env file to:
``` {.sourceCode .env}
    CYPRESS_BASE_URL="http://localhost:8081"
```

> .env file should be located at the root of the project

Config
-----

- Cypress files are located here: hat/assets/js/cypress
- cypress config file is at the root of the project ([doc](https://docs.cypress.io/guides/references/configuration#cypress-json))
  
    > for now we are only changing the default folder of cypress, changing the default viewport and use session support that allows us to save a session between tests

### 1. Fixtures  `hat/assets/js/cypress/fixtures`
All the fake data needed to test the app in JSON format.
You can find the doc [here](https://docs.cypress.io/guides/guides/network-requests#Fixtures)


### 2. Integration tests  `hat/assets/js/cypress/integration`
The tests organized per domains.
By prefixing folder name with numbers you can specify the orders of the tests.
Test file has to be suffixed with `.spec.js`.

Authentification is also tested, it is considered as a domain apart

### 3. Plugins `hat/assets/js/cypress/plugins/index.js`

For now we are extending Cypress config with custom env variables used before.

You can also install extra [plugins](https://docs.cypress.io/plugins/directory) to use while testing.

[Doc](https://docs.cypress.io/guides/tooling/plugins-guide)

### 4. Support  `hat/assets/js/cypress/support/index.js`
By default Cypress will automatically include the support file.
This file runs before every single spec file.

We are using it to preserve cookies between tests.

> It includes commands file.

[Doc](https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests#Support-file)


### 5. Commands  `hat/assets/js/cypress/support/commands.js`

In this file we can add custom commands that you can use in tests.

e.g. `cy.login()` will authenticate the user into Django and save the session.
> In order to test a connected page you have to use `cy.login()` and `cy.visit("the_path_to_test")` before each test

[Doc](https://docs.cypress.io/api/cypress-api/custom-commands)



Testing
-------

- Run `cypress:open` to launch cypress ui
- Run `test:e2e` to launch cypress tests with node
    > This one need to be implemented in [github actions](https://docs.cypress.io/guides/continuous-integration/github-actions)

- You can find a good example of tests in `hat/assets/js/cypress/integration/2 - forms/list.spec.js`


The approach here is:
- for each elements presents, test all possible states and behaviours
- changing filters values and checking that the url has been correctly adapted
- check also if the Api call are done with the correct parameters
- change user permissions and test the behaviour
- ...
