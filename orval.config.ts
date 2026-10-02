import { mutationInvalidates as validationWorkflowsMutationInvalidates } from './hat/assets/js/orval/apiConfiguration/validationWorkflows/configuration';
import {
    createSchemaTransformer,
    normalizeSchema,
} from './hat/assets/js/orval/transformer/fakerTransformer';
import { mutationInvalidates as accountsMutationInvalidates } from './hat/assets/js/orval/apiConfiguration/accounts/configuration';

require('dotenv').config();

const ORVAL_TARGET = `${process.env.ORVAL_TARGET_URL_PROTOCOL || 'http'}://${process.env.ORVAL_TARGET_URL_DOMAIN || 'localhost:8000'}`;
const ORVAL_TARGET_FILE = process.env?.ORVAL_TARGET_FILE;

const createConfig = (
    project: string,
    tags: string[] | RegExp[],
    mutationInvalidates?: any[],
    schemas?: string[] | RegExp[],
) => {
    return {
        input: {
            target: ORVAL_TARGET_FILE
                ? ORVAL_TARGET_FILE
                : new URL('/swagger/?format=json', ORVAL_TARGET).toString(),
            filters: {
                tags: tags,
                ...(schemas ? { schemas: schemas } : {}),
            },
            parserOptions: {
                headers: [
                    {
                        domains: [
                            process.env.ORVAL_TARGET_URL_DOMAIN ||
                                'localhost',
                        ],
                        headers: {
                            Authorization: `Bearer ${process.env.API_TOKEN}`,
                            Accept: 'application/json',
                        },
                    },
                ],
            },
            override: {
                transformer: createSchemaTransformer(normalizeSchema),
            },
        },

        output: {
            mode: 'tags-split',
            client: 'react-query',
            clean: true,
            baseUrl: {
                runtime: 'process.env.ORVAL_API_BASE_URL',
            },
            workspace: `./hat/assets/js/apps/Iaso/api/${project}`,
            override: {
                // operations: OperationConfig.operations,
                requestOptions: {
                    credentials: 'same-origin',
                },
                query: {
                    version: 3,
                    // version: 5,
                    runtimeValidation: true,
                    shouldSplitQueryKey: true,
                    useOperationIdAsQueryKey: true,
                    useInvalidate: true,
                    mutationInvalidates: mutationInvalidates ?? [],
                    queryOptions: {
                        path: '../../../../orval/mutator/custom-query-options.ts',
                        name: 'getCustomQueryOptions',
                    },
                    mutationOptions: {
                        path: '../../../../orval/mutator/custom-mutation-options.ts',
                        name: 'useCustomMutationOptions',
                        optionalQueryClient: true,
                    },
                },
                fetch: {
                    includeHttpResponseReturnType: false,
                },
                mutator: {
                    path: '../../../../orval/client/custom-fetch.ts',
                    name: 'customFetchInstance',
                    runtimeValidation: true,
                },
                zod: {
                    strict: {
                        response: true,
                        query: true,
                        param: true,
                        header: true,
                        body: true,
                    },
                },
            },
            mock: {generators: [{
                type: 'msw',
                preferredContentType: 'application/json',
                delay: () =>
                    process.env?.MSW_DELAY
                        ? parseInt(process.env.MSW_DELAY)
                        : 0,
                delayFunctionLazyExecute: true,
                arrayMin: 1,
            }]},
            target: './endpoints',
            schemas: {
                type: 'zod',
                path: './models',
            },
        },

        hooks: {
            afterAllFilesWrite: ['eslint --cache --fix'],
        },
    };
};

module.exports = {
    accounts: createConfig(
        'accounts',
        ['Account'],
        accountsMutationInvalidates,
    ),
    accountFeatureFlags: createConfig('accountFeatureFlags', [
        'Account feature flags',
    ]),
    apiImports: createConfig('apiImports', ['API import']),
    instanceDiff: createConfig('instanceDiff', ['Submission diff']),
    modules: createConfig('modules', ['Modules']),
    validationWorkflows: createConfig(
        'validationWorkflows',
        ['Validation workflows'],
        validationWorkflowsMutationInvalidates,
    ),
    // profiles: createConfig('profiles', ['Profiles'])
};
