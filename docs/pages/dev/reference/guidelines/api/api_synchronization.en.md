# API synchronization

This document outlines how to effectively synchronize the backend and frontend using OpenAPI.

We will primarily rely on the following tools:

* [drf-spectacular](https://drf-spectacular.readthedocs.io/en/latest/) (backend)
* [orval](https://orval.dev/) (frontend)

## Table of contents

- [Backend](#backend)
  - [Setting up drf-spectacular]
- [Frontend](#frontend)

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

## Front end

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
* `ORVAL_TARGET_FILE`: path to a local OpenAPI file, if used instead of a remote endpoint
* `API_TOKEN`: bearer token used when fetching the schema from a protected /swagger/ endpoint
* `MSW_DELAY`: adds an artificial delay to MSW mocks, useful for simulating loading states during development and testing

### Generating new file

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
  });

  afterEach(() => {
    server.resetHandlers();
    TestingQueryClient.clear();
  });

  afterAll(() => {
    server.close();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    faker.seed(Date.now());
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

#### E2E tests

In addition to mocked integration tests, we can also run true end-to-end (E2E) tests against the real backend.

This approach allows us to validate full user flows, including basic CRUD operations, and ensures that the frontend and backend work correctly together in a real environment.

To support this, a set of backend testing helpers has been introduced. These helpers make it possible to programmatically create and clean up data, enabling reliable and repeatable E2E tests without manual setup.

###### 1. Setup
###### 2. Functional Test Helpers
###### 3. Testing

## FAQ

* How do I extend a generated zod schema ?
Like so: 
```typescript

import BaseSchema from "project/models";

const NewSchema = BaseSchema.extend({
  
})
```

## Known issues and caveats

* orval does not include zod parsing by default with react-query and custom fetch/mutators/httpClient... , it's WIP on their side https://github.com/orval-labs/orval/issues/2858
* orval does not include operations when using custom mutators, had to patch it
* few bugs on orval side, used patch package