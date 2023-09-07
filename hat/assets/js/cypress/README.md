Development environment - Cypress e2e tests
===========================================

[Cypress documentation](https://docs.cypress.io/guides/overview/why-cypress)

Cypress is now used to test the user interface.

Prerequisites
-------------

Before you can run Cypress, you must have a version of Node.js and npm that matches the current Dockerfile:

- Install [nvm](https://github.com/nvm-sh/nvm) locally
- `nvm install 14.17`
- `nvm use 14`
- `npm install -g npm@8.5`

Setup
-----

- Run `npm ci` to install it locally

- To run the backend on a fresh database instance with a test user you can launch a django testserver. Alternatively see below to run on your current database.
  - in docker:
```
docker-compose run   -p 8000:8000 iaso manage testserver --addrport 0.0.0.0:8000 --noinput iaso/fixtures/user.yaml
```
  - outside docker
```
./manage.py testserver --noinput iaso/fixtures/user.yaml
```

- Launch Cypress interface
```
CYPRESS_USERNAME=test CYPRESS_PASSWORD=test CYPRESS_BASE_URL="http://localhost:8000" npm run cypress:open
```

You can also set the variable in the .env file, to not have to repeat them see below.

The database is deleted and recreated each time `testserver` is rerun.
This method is used in the CI, so use it when you need to reproduce an error in the CI.

### Launch Cypress on your current server or advanced config

- As the authentication flow is tested too, you should set environment variables in your `.env` file:
``` {.sourceCode .env}
    CYPRESS_USERNAME="username_to_use"
    CYPRESS_PASSWORD="password_to_use"
```
> This user can be a basic one without permissions, we will intercept profile call and override it for testing

- Application should run on the base url specified in the .env file to:
``` {.sourceCode .env}
    CYPRESS_BASE_URL="http://localhost:8081"
```

> `.env` file should be located at the root of the project

Config
-----

- Cypress files are located here: hat/assets/js/cypress
- cypress config file is at the root of the project ([doc](https://docs.cypress.io/guides/references/configuration#cypress-json))
  
    > for now, we are only changing the default folder of cypress, changing the default viewport and use session support that allows us to save a session between tests

### 1. Fixtures  `hat/assets/js/cypress/fixtures`
All the dummy data needed to test the app in JSON format.
You can find the doc [here](https://docs.cypress.io/guides/guides/network-requests#Fixtures)


### 2. Integration tests  `hat/assets/js/cypress/integration`
The tests organised by domains.
By prefixing folder names with numbers you can specify the order of the tests.
Test file has to be suffixed with `.spec.js`.

Authentication is also tested, it is considered as a domain.
> In order to test a connected page you have to use `cy.login()` and `cy.visit("the_path_to_test")` before each test

### 3. Plugins `hat/assets/js/cypress/plugins/index.js`

For now, we are extending Cypress config with the custom env variables described in "Setup".

You can also install extra [plugins](https://docs.cypress.io/plugins/directory) to use while testing.

[Doc](https://docs.cypress.io/guides/tooling/plugins-guide)

### 4. Support  `hat/assets/js/cypress/support/index.js`
By default, Cypress will automatically include the support file.
This file runs before every single spec file.

We are using it to preserve cookies between tests.

> It includes commands file.

[Doc](https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests#Support-file)


### 5. Commands  `hat/assets/js/cypress/support/commands.js`

In this file we can add custom commands that can be used in tests.

e.g. `cy.login()` will authenticate the user into Django and save the session.
> In order to test a connected page you have to use `cy.login()` and `cy.visit("the_path_to_test")` before each test

[Doc](https://docs.cypress.io/api/cypress-api/custom-commands)

### 6. Testing plugins

Test files for plugins should be added in a folder named `cypress` and placed next to the plugin's own `/src` folder. E.g, for polio, the (front-end) code is located at `plugins/polio/js/src` so the tests are at `/plugins/polio/js/cypress`

There is a `Cypress.env` variable called `plugins` which contains the names of all active plugins, in the format `pluginA,pluginB,pluginC`. To avoid Iaso's CI running your plugin's tests even when the plugin is not active, the tests should be wrapped in a condition:

```javascript
if (Cypress.env('plugins')?.includes('pluginA')) { // where pluginA is your plugin's name
    describe('test plugin', () => {
        // Your test
        });
    });
```

Alternately, you can use the `testPlugin()` helper provided at `iaso/hat/assets/js/cypress/support/testPlugin.js`:

```javascript
testPlugin('pluginA',()=>{ // where pluginA is your plugin's name
    describe('test plugin', () => {
        // Your test
    });
});

```


Testing
-------

- Run `cypress:open` to launch cypress GUI
- Run `test:e2e` to launch cypress tests with node
    > This one need to be implemented in [GitHub actions](https://docs.cypress.io/guides/continuous-integration/github-actions)

- You can find a good example of tests in `hat/assets/js/cypress/integration/2 - forms/list.spec.js`


The approach here is:
- for each element presents, test all possible states and behaviours
- changing filters values and checking that the url has been correctly adapted
- check also if the Api call are done with the correct parameters
- change user permissions and test the behaviour
- check the components' error handling
