# API synchronization

This document outlines how to effectively synchronize the backend and frontend using OpenAPI.

We will primarily rely on the following tools:

* [drf-spectacular](https://drf-spectacular.readthedocs.io/en/latest/) (backend)
* [orval](https://orval.dev/) (frontend)

---


## Table of contents

- [Quick start](#quick-start)
- [Backend](#backend)
  - [Setting up drf-spectacular](#setting-up-drf-spectacular)
  - [Documenting your endpoint](#documenting-your-endpoint)
  - [Documenting an endpoint that lives in a plugin](#documenting-an-endpoint-that-lives-in-a-plugin)
  - [Testing the generated OpenAPI schema](#testing-the-generated-openapi-schema)
  - [Utilities](#utilities)
- [Frontend](#frontend)
  - [Configuration](#configuration)
  - [Generating new files](#generating-new-files)
  - [Generating a client for a plugin](#generating-a-client-for-a-plugin)
  - [Integrating React Query hooks](#integrating-react-query-hooks)
  - [Using zod schemas](#using-zod-schemas)
  - [Integrating with formik](#integrating-with-formik)
  - [Testing](#testing)
    - [Integration testing (without a backend)](#integration-testing-without-a-backend)
    - [E2E Tests](#e2e-tests)
  - [CI](#ci)
- [FAQ](#faq)
- [Known Issues and Caveats](#known-issues-and-caveats)

---


## Quick start

The typical workflow is:

1. Update backend (serializers / views)
2. Generate OpenAPI schema
3. Run Orval
4. Use generated hooks in frontend
5. Test with MSW and/or E2E

### Generate OpenAPI schema

```shell
python manage.py generate_openapi_schema
```

### Run orval
```shell
npm run orval
```

### Import generated hooks
```typescript
import { useGetSomething } from '...'
```

---


## Backend

To enable client side typescript generation from our swagger, we first need to make sure that our swagger is as accurate as possible.

### Setting up drf-spectacular

To generate the OpenAPI schema from the backend, we use [drf-spectacular](https://drf-spectacular.readthedocs.io/en/latest/), a library designed to integrate seamlessly with Django REST Framework.

Most of the configuration is defined in `settings.py`:

```python
SPECTACULAR_SETTINGS = {
    "SWAGGER_UI_DIST": "SIDECAR",
    "SWAGGER_UI_FAVICON_HREF": "SIDECAR",
    "REDOC_DIST": "SIDECAR",
    "TITLE": "Iaso",
    "DESCRIPTION": "Iaso Swagger",
    "VERSION": "v1",
    "SERVE_PERMISSIONS": [
        "iaso.drf_spectacular_utils.permissions.HasAccountAndProfile",
    ],
    "TAGS": [
        {"name": "Mobile", "description": "Endpoints used by the mobile application"},
        {"name": "v2", "description": "Version 2 of the API"},
    ],
    "SWAGGER_UI_SETTINGS": {  # see https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/
        "defaultModelsExpandDepth": 0,  # collapsing schemas by default
        "docExpansion": "list",  # put this to "none" if you want all the sections to be collapsed by default
        "tagsSorter": "alpha",  # sorting tags by alphanumeric
        "displayOperationId": bool(DEBUG),
    },
    "DISABLE_ERRORS_AND_WARNINGS": get_env_var_or_default("DRF_SPECTACULAR_DISABLE_ERRORS_AND_WARNINGS", "true").lower()
    in ["true", "1"],
    # "COMPONENT_NO_READ_ONLY_REQUIRED": True,
    "COMPONENT_SPLIT_REQUEST": True,
}
```

### Documenting your endpoint

Here are some best practices to ensure your endpoints are well-documented and compatible with OpenAPI generation using drf-spectacular:

* Use **serializers** for request and response bodies
* Use **filters** / **query parameters** for GET inputs (via django-filter or DRF filters)
* Explicitly document custom fields:
  * For `SerializerMethodField`, always annotate the method with `@extend_schema_field`
* Prefer explicit `@extend_schema` annotations when behavior is non-trivial

Once your ViewSet is ready, always verify the schema using your Swagger UI (e.g. /swagger-ui/) to ensure:

* fields are correctly typed
* parameters are visible
* no endpoints are missing

### Documenting an endpoint that lives in a plugin

Plugin endpoints reach the schema exactly like core ones, but two rules become mandatory because
several plugins can be enabled at the same time.

#### Namespace your component names

drf-spectacular derives a component name from the **serializer class name**, so two plugins
declaring a `NotificationSerializer` both produce a component named `Notification` and the last one
loaded wins.

Use `@extend_schema_serializer` to namespace the component, and keep the class name as is so the
Python imports do not change:

```python
from drf_spectacular.utils import extend_schema_serializer

@extend_schema_serializer(component_name="TrypelimNotification")
class NotificationSerializer(serializers.Serializer):
    ...
```


#### Namespace your tags

Orval selects the operations of a project by tag, so a plugin tag must be unique across plugins and
stable over time: `Trypelim Notifications`, `Polio - Notifications`, and so on. Renaming a tag
without updating the plugin descriptor silently empties the generated client (see
[Generating a client for a plugin](#generating-a-client-for-a-plugin)).

### Testing the generated OpenAPI schema

We provide a custom `SwaggerTestCaseMixin` to validate that API responses conform to the declared schema.

Example:

```python
from iaso.test import SwaggerTestCaseMixin, APITestCase

class BaseProfileAPITestCase(SwaggerTestCaseMixin, APITestCase):
    def assertValidSchema(self):
        url = "/api/profile/"
        res = self.client.get(url)
        res_json = self.assertJSONResponse(res, 200)
        self.assertResponseCompliantToSwagger(res_json, "MySchema")
```

This ensures that:

* your endpoint response matches the documented schema
* regressions are caught early in backend tests

### Utilities

A Django management command is available to automatically generate an OpenAPI schema file.

```shell
python manage.py generate_openapi_schema
```

---


## Frontend

We use Orval to generate frontend code from the OpenAPI specification defined by the backend.

This enables the automatic generation of:

* MSW mocks
* React Query hooks
* Zod schemas and validation

### Configuration

As described in the documentation, all configuration is defined in `orval.config.ts`.

Several environment variables are also available to control the generation process:

* `ORVAL_TARGET_URL_PROTOCOL`: `http` or `https`, the protocol used in the URL to fetch the OpenAPI schema
* `ORVAL_TARGET_URL_DOMAIN`: default `localhost:8000`, the host serving the OpenAPI schema
* `ORVAL_API_BASE_URL`: the base url that will be appended to your generated hooks for the API.
* `ORVAL_TARGET_FILE`: path to a local OpenAPI file, if used instead of a remote endpoint
* `API_TOKEN`: bearer token used when fetching the schema from a protected /swagger/ endpoint
* `MSW_DELAY`: adds an artificial delay to MSW mocks, useful for simulating loading states during development and testing
* `PLUGINS`: the plugins enabled on the backend, read from the same variable Django uses. Only the plugins listed here, and whose tag is actually present in the schema, contribute an Orval project (see [Generating a client for a plugin](#generating-a-client-for-a-plugin)). An unset or empty value means no plugin is enabled, exactly as in `hat/settings.py`

Note that `ORVAL_TARGET_URL_DOMAIN` is used twice: to build the schema URL, and to decide which
domain the `Authorization` header is attached to. If it does not match the host actually serving the
schema, the bearer token is dropped and the generation fails with a 401 and
`Failed to resolve input`.

### Generating new files

We have split the `orval.config.ts` into multiple projects, allowing selective regeneration of specific parts of the API without overwriting the entire generated client.

Each project should be associated with at least one OpenAPI tag.

To add a new project:

#### 1. Define the mutation invalidates and operations:

Under `./hat/assets/js/orval/apiConfiguration`, create a folder named after your project.

Add a `configuration.ts` file that defines:

* query configurations
* mutation → cache invalidation rules

Example:

```typescript
export const workflowsOperations = {
    apiValidationWorkflowsList: {
        query: {
            options: {
                retry: false,
                staleTime: Infinity,
                cacheTime: Infinity,
                keepPreviousData: true,
            },
        },
    },
    apiValidationWorkflowsRetrieve: {
        query: {
            options: {
                staleTime: Infinity,
                cacheTime: Infinity,
                keepPreviousData: true,
            },
        },
    },
};

export const mutationInvalidates = [
    {
        onMutations: [
            'apiValidationWorkflowsDestroy',
            'apiValidationWorkflowsUpdate',
            'apiValidationWorkflowsPartialUpdate',
        ],
        invalidates: [
            'apiValidationWorkflowsList',
            { query: 'apiValidationWorkflowsRetrieve', params: ['slug'] },
        ],
    },
    {
        onMutations: ['apiValidationWorkflowsCreate'],
        invalidates: ['apiValidationWorkflowsList'],
    },
];
```

Note that it's possible to make a GET operations locale aware, meaning react queries will trigger again if the locale changes.

Example: 

```typescript
export const modulesOperations = {
    apiModulesList: {
        query: {
            meta: {
                localeAware: true,
            },
            options: {
                retry: false,
                staleTime: Infinity,
                cacheTime: Infinity,
                keepPreviousData: true,
            },
        },
    },
    apiModulesDropdownList: {
        query: {
            meta: {
                localeAware: true,
            },
            options: {
                retry: false,
                staleTime: Infinity,
                cacheTime: Infinity,
                keepPreviousData: true,
            },
        },
    },
};
```

#### 2. Register operations in the central configuration
Do not forget to export your operations in `apiConfiguration/index.ts`. (This will allow one of our custom orval fix to work.)

Example:

```typescript

import { workflowsOperations } from './validationWorkflows/configuration';

export const OperationConfig: Record<string, any> = {
    operations: {
        ...workflowsOperations,
    },
};
```

####  3. Add an entry to orval config 
Add a new entry in `orval.config.ts`:

```javascript
module.exports = {
    ...,
    validationWorkflows: createConfig(
            <your_project>, 
            [<related_openapi_tags>], 
            your_mutation_array
    ),
};
```

`createConfig` also accepts a `schemas` filter and a `workspace`, the folder the client is generated
into. It defaults to `./hat/assets/js/apps/Iaso/api/<your_project>`; plugins pass a path inside their
own folder instead, see [Generating a client for a plugin](#generating-a-client-for-a-plugin).

#### 4. Generate the client
Once everything is configured, run:

```shell
npm run orval -- --project=<your_project> 
```

or 

```shell
npm run orval 
```

This will generate the new API module, ready to be used in the codebase.

#### Generating a client for a plugin

Plugins do not run their own Orval: generation is always driven by the root `orval.config.ts`, and a
plugin only *registers* a project. The generated files are written inside the plugin folder, while
the mutator and the query/mutation option helpers always come from `hat/assets/js/orval/`, so every
generated hook imports the same `react-query` instance as the host application.

#### 1. Declare the project in the plugin

Create `plugins/<plugin>/js/orval.config.cjs`:

```javascript
module.exports = [
    {
        project: 'trypelimNotifications',
        tags: ['Trypelim Notifications'],
        workspace: './plugins/trypelim/js/src/domains/Management/notifications/api',
        mutationInvalidates: [],
    },
];
```

A second example, from the polio plugin, with the mutations that invalidate the list:

```javascript
module.exports = [
    {
        project: 'polioNotifications',
        tags: ['Polio - Notifications'],
        workspace: './plugins/polio/js/src/domains/Notifications/api',
        mutationInvalidates: [
            {
                onMutations: [
                    'apiPolioNotificationsCreate',
                    'apiPolioNotificationsUpdate',
                    'apiPolioNotificationsPartialUpdate',
                    'apiPolioNotificationsDestroy',
                    'apiPolioNotificationsImportXlsxCreate',
                ],
                invalidates: ['apiPolioNotificationsList'],
            },
        ],
    },
];
```

* the file must be at `js/orval.config.cjs`, not `js/src/`, since the root config resolves exactly that path
* the extension must be `.cjs`: the file is loaded with a synchronous `require()`, so it has to stay CommonJS even if a `"type": "module"` is introduced later
* point `workspace` at a dedicated `api` subfolder and keep hand-written code (`index.tsx`, `hooks/`, `components/`) outside of it, so a regeneration only ever rewrites generated files

#### 2. Nothing to add to the root config

`getPluginProjectDescriptors()`, in `hat/assets/js/orval/plugins/pluginProjects.ts`, lists the plugin
folders, loads the descriptor of each one, and `orval.config.ts` turns the surviving ones into
projects. A new plugin is picked up automatically.

#### 3. Enable the plugin, on the backend too

A plugin descriptor becomes a project only if two conditions hold, both of them protecting the
generated client. Orval empties the workspace of a project before resolving its input and reports a
success even when the tag filter matched no operation, so a project that generates nothing does not
leave its client untouched: it deletes it, or at least rewrites its `index.ts` barrels as empty
files, which breaks every import of the domain.

1. **the plugin is listed in `PLUGINS`**, read exactly as Django reads it, an unset value meaning no
   plugin is enabled. A plugin folder is on disk whether or not its Django app is loaded.
2. **the tag is present in the schema**. `PLUGINS` only describes what the process running Orval
   believes; it cannot know what the targeted backend serves. Running `PLUGINS=trypelim npm run orval`
   against a backend started without the plugin passes the first check while the schema has none of
   its operations. The schema is therefore fetched once per run and the tag looked up in it. An
   unreachable backend or an expired token also fails this check, which skips the project instead of
   emptying it.

Skipped projects are logged, and `--project=<skipped project>` fails with `Project not found` rather
than touching any file. As a last safety net, plugin workspaces are generated with `clean: false`, so
even an unexpected empty generation cannot delete files.


A bare `npm run orval` regenerates the core projects and every enabled plugin project.


### Integrating React Query hooks

Orval generates React Query hooks under `./hat/assets/js/apps/Iaso/api/<your_project>/endpoints/`, which can be directly used in the application.

Example usage:

```typescript

import {
    useApiValidationWorkflowsCreate,
    useApiValidationWorkflowsRetrieve,
} from 'Iaso/api/validationWorkflows';

useApiValidationWorkflowsRetrieve()
```

Each generated hook comes with the default React Query options defined in the project configuration (see operations and mutationInvalidates). 
These defaults ensure consistent caching and invalidation behavior across the application.

These options can still be overridden at call time if needed:
```typescript

useApiValidationWorkflowsRetrieve(slug, {...otherQueryOptions})
```

### Using zod schemas 

WIP

### Integrating with formik

Each generated endpoints comed with zod schemas that we can reuse into formik. 
In order to achieve this, we'll use [zod-formik-adapter](#https://github.com/robertLichtnow/zod-formik-adapter) that allows us to convert zod schemas to formik compatible validation schemas.

There is also a wrapper utility function `withFormikSubmitAsync` that you can use in the formik `save` method to automatically display errors from the backend.

Here under an example:

```typescript

import React from 'react';
import { Alert, Box } from '@mui/material';
import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
    AccountUpdateAIApiKeyRequest,
    useApiAccountsAiApiKeyUpdate,
} from 'Iaso/api/accounts';
import { EditIconButton } from 'Iaso/components/Buttons/EditIconButton';
import PasswordInput from 'Iaso/components/forms/PasswordInput';
import MESSAGES from 'Iaso/domains/accounts/messages';
import { withFormikSubmitAsync } from 'Iaso/utils/forms';

type Props = {
    accountId: number;
    isOpen: boolean;
    closeDialog: () => void;
};

const EditAIApiKeyModal = ({ accountId, isOpen, closeDialog }: Props) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveAIApiKey } = useApiAccountsAiApiKeyUpdate({
        mutation: {
            ignoreErrorCodes: [400],
        },
    });
    const formik = useFormik({
        initialValues: {},
        validationSchema: toFormikValidationSchema(
            AccountUpdateAIApiKeyRequest,
        ),
        onSubmit: withFormikSubmitAsync(values =>
            saveAIApiKey({
                id: accountId,
                data: values as AccountUpdateAIApiKeyRequest,
            }),
        ),
    });
    ...

```


### Testing

The generated code includes a set of testing utilities that make it easier to write efficient and reliable tests:

* MSW mocks
* Faker.js integration

#### Integration testing (without a backend)

These tools allow us to mock API calls, meaning a backend is no longer required for integration testing.

##### 1. Setup

Import the required MSW mocks in your test:

```typescript
import {
    getValidationWorkflowsMock,
} from 'Iaso/api/validationWorkflows/endpoints/validation-workflows/validation-workflows.msw';

const server = setupServer(...getValidationWorkflowsMock());
```

Configure the MSW server using Vitest hooks:
```typescript
describe(() => {
  beforeAll(() => {
    server.listen({
      onUnhandledRequest: 'error',
    });
    faker.seed(1); // if you want "fixed" generated mock data 
  });

  afterEach(() => {
    server.resetHandlers();
    TestingQueryClient.clear();
  });

  afterAll(() => {
    faker.seed(Date.now()); // reset
    server.close();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });
});

```
##### 2. Mock data

By default, generated mocks return randomized data using Faker.js.

If you need a specific response for a given call, you can override it:

```typescript
import {
  getApiValidationWorkflowsListResponseMock,
  getApiValidationWorkflowsListMockHandler,
} from 'Iaso/api/validationWorkflows/endpoints/validation-workflows/validation-workflows.msw';

const data = getApiValidationWorkflowsListResponseMock({
  count: 2,
  has_next: false,
  has_previous: false,
  limit: 10,
  pages: 1,
  page: 1,
}) as WithResults;

server.use(
        getApiValidationWorkflowsListMockHandler(validationWorkFlows),
);
```

##### 3. Deterministic tests
To avoid flaky tests caused by random data, you may need to fix the Faker seed. A helper function `getSeedFor` is available to help determine a stable seed.

##### 4. Simulating loading states

You can simulate network latency using the MSW_DELAY environment variable:
```typescript

it('displays a spinner while loading', async () => {
    vi.stubEnv('MSW_DELAY', '1000000');
})
```
##### 5. Overriding generated mocks
Generated handlers can be overridden when needed:

```typescript
const customMockHandlers = {
  // @ts-ignore
  destroy: getApiValidationWorkflowsDestroyMockHandler(async info => {
    mockDeleteWorkflow(info.params.slug);
    return new HttpResponse(null, { status: 204 });
  }),
};

server.use(
   getApiValidationWorkflowsListMockHandler(validationWorkFlows),
   customMockHandlers.destroy,
);
```

##### 6. Summary

These tools make it easy to define flexible API mocks and thoroughly test the frontend without requiring a running backend.

#### E2E Tests

In addition to mocked integration tests, we can also run true end-to-end (E2E) tests against the real backend.

This approach validates complete user flows, including basic CRUD operations, and ensures that the frontend and backend interact correctly in a real environment.

To support this, a set of backend testing helpers has been introduced. These helpers allow programmatic data setup and cleanup, enabling reliable and repeatable E2E tests without manual intervention.

###### 1. Setup

In your `settings.py`, set the `TEST_MODE` variable to `True` to enable the functional test (FT) helpers.

When using this mode, it is strongly recommended to use a dedicated database, as it will be flushed during tests.

###### 2. Functional Test Helpers

The API exposes several endpoints to support E2E testing and database management:

- `/api/ft-helpers/clean-database/`  
  Resets the backend database by flushing all data.

- `/api/ft-helpers/create-user/`  
  Creates a user that can be used for authentication during tests.

- `/api/token/`  
  Returns an authentication token using the credentials of the created user. This token can then be included in request headers.

###### 3. Writing Tests

Below is an example of an E2E test with a running backend.
These tests should be located under: `__tests__/api/<project>.api.test.tsx`
To avoid any issue with the backend, you need to run a special command for those tests : 
```shell
npm run test:api-e2e
```

```typescript

import { act, renderHook, waitFor } from '@testing-library/react';
import {
    useApiValidationWorkflowsCreate,
    useApiValidationWorkflowsRetrieve,
} from 'Iaso/api/validationWorkflows';
import { useCustomApiValidationWorkflowsList } from 'Iaso/domains/instances/validationWorkflow/api/Get';
import { SUBMISSION_VALIDATION_WORKFLOW } from 'Iaso/utils/featureFlags';
import { cleanDatabase, createUserAndGetToken } from '../../tests/ft_helpers';
import { QueryClientWrapperWithIntlProvider } from '../../tests/helpers';

let token: any;

describe('ValidationWorkflow api e2e tests', () => {
    beforeEach(async () => {
        // clean DB
        await cleanDatabase();

        // create user and retrieve token
        token = await createUserAndGetToken({
            username: 'myuser',
            password: 'mypasswordnotsosecure',
            account_name: 'myaccountname',
            feature_flags: [SUBMISSION_VALIDATION_WORKFLOW],
            is_superuser: true,
            is_staff: true
        });
    });

    it('CRUD accordingly', async () => {
        const { result: resultList } = renderHook(
            () =>
                useCustomApiValidationWorkflowsList(
                    {},
                    {
                        request: {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    },
                ),
            { wrapper: QueryClientWrapperWithIntlProvider },
        );

        await waitFor(() => expect(resultList.current.isSuccess).toBe(true));

        expect(resultList.current.data).toStrictEqual({
            count: 0,
            has_next: false,
            has_previous: false,
            limit: 20,
            page: 1,
            pages: 1,
            results: [],
        });

        // create validation workflow
        const { result: resultCreate } = renderHook(
            () =>
                useApiValidationWorkflowsCreate({
                    request: {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                }),
            { wrapper: QueryClientWrapperWithIntlProvider },
        );

        await act(async () => {
            await resultCreate.current.mutateAsync({
                data: {
                    name: 'test-validation-workflow',
                    description: 'a description',
                },
            });
        });

        await waitFor(() => {
            expect(resultCreate.current.isSuccess).toBe(true);
            expect(resultCreate.current.isError).toBe(false);
        });

        await act(async () => {
            await resultList.current.refetch();
        });

        await waitFor(() => expect(resultList.current.isSuccess).toBe(true));

        expect(resultList.current.data).toMatchObject({
            count: 1,
            has_next: false,
            has_previous: false,
            limit: 20,
            page: 1,
            pages: 1,
        });
        expect(resultList.current.data?.results.length).toBe(1);
        expect(resultList.current.data?.results[0]).toMatchObject({
            name: 'test-validation-workflow',
            slug: 'test-validation-workflow',
            form_count: 0,
            created_by: 'myuser',
            updated_by: null,
        });

        expect(resultList.current.data?.results[0].updated_at).not.toBeNull();
        expect(resultList.current.data?.results[0].created_at).not.toBeNull();

        // retrieve
        const { result: resultRetrieve } = renderHook(
            () =>
                useApiValidationWorkflowsRetrieve('test-validation-workflow', {
                    request: {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                }),
            { wrapper: QueryClientWrapperWithIntlProvider },
        );

        await waitFor(() => {
            expect(resultRetrieve.current.isSuccess).toBe(true);
        });

        expect(resultRetrieve.current.data).toMatchObject({
            created_by: 'myuser',
            description: 'a description',
            forms: [],
            name: 'test-validation-workflow',
            node_templates: [],
            slug: 'test-validation-workflow',
            updated_by: null,
        });

        expect(resultRetrieve.current.data?.updated_at).not.toBeNull();
        expect(resultRetrieve.current.data?.created_at).not.toBeNull();

        // update

        // check with read and list

        // delete
    });
});



```

#### CI

Since Orval-generated files must be committed and pushed to the repository, a CI check ensures they are always up to date.

This helps prevent inconsistencies between the OpenAPI schema and the generated client, reducing the risk of runtime errors.

---

## FAQ

### How do I extend a generated Zod schema?

You can extend a generated schema using Zod’s `.extend()` method:

```typescript
import { BaseSchema } from "project/models";

const NewSchema = BaseSchema.extend({
  // add or override fields here
});
```

This allows you to reuse the generated schema while customizing it for your specific needs.

### Orval reports a success but my generated files disappeared or my index.ts is empty

The tag of the project matched no operation in the schema, and the output folder had already been
cleaned. Check, in order:

* is the plugin listed in `PLUGINS`, both in the process running Orval and in the container serving
  the schema ?
* before generating, does the schema contain the tag?
* was the tag renamed in the backend, or an `@extend_schema` decorator removed?


### My plugin is skipped although PLUGINS is correct in the .env

Print what the config actually reads, the value may come from somewhere else:

```shell
echo "shell=[$PLUGINS]"
grep -n '^PLUGINS' .env
node -e "require('dotenv').config(); console.log('dotenv=['+process.env.PLUGINS+']')"
```

`dotenv` never overrides a variable already exported in your shell, keeps the first of two duplicate
lines, and does not strip an inline comment written after the value.


### When running tests with msw, I want to hide all the logs from network interceptor

In your .env :
```dotenv
VITEST_DEBUG="!msw:*"
```

---


## Known Issues and Caveats

1. **Zod integration**  
   Orval does not currently support Zod parsing out of the box when using `react-query` with custom fetchers, mutators, or HTTP clients. This is a known limitation and is still a work in progress on their side:  
   https://github.com/orval-labs/orval/issues/2858 https://github.com/orval-labs/orval/pull/3226

2. **Missing operations with custom mutators**  
   When using custom mutators, some operations may not be generated. Refer to the implementation in `custom-mutators` for details and workarounds.

3. **Upstream bugs**  
   A few issues originate from Orval itself. Temporary fixes have been applied locally using `patch-package` until upstream fixes are available.

4. **Cleaning runs before the schema is read**  
   Orval empties the workspace of a project before resolving its input, and reports a success even
   when the tag filter matched no operation. A project generating nothing therefore *deletes* its
   client, or at least rewrites its `index.ts` barrels as empty files, which breaks every import of
   the domain. This happens when the tag is missing from the schema (plugin not loaded on the
   backend, tag renamed, `@extend_schema` removed), but also when the backend is unreachable or the
   token has expired.
   Plugin projects are protected on three levels, see
   [Generating a client for a plugin](#generating-a-client-for-a-plugin): the `PLUGINS` check, the
   presence of the tag in the schema, and `clean: false` on their workspace.
   **Core projects still use `clean: true`** and are not covered: check that the schema is the one
   you expect before generating, and keep the generated clients committed so `git checkout` can
   restore them.