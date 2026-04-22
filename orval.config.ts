import { mutationInvalidates as workflowMutationInvalidates } from './hat/assets/js/orval/apiConfiguration/validationWorkflows/configuration';
import { useCustomMutationOptions } from './hat/assets/js/orval/mutator/custom-mutation-options';

require('dotenv').config();

const ORVAL_TARGET = `${process.env.ORVAL_TARGET_URL_PROTOCOL || "http"}://${process.env.ORVAL_TARGET_URL_DOMAIN || "localhost:8000"}`
module.exports = {

    api: {

        input: {
            target: new URL('/swagger/?format=json', ORVAL_TARGET).toString(),
            filters: {
                // mode: 'exclude',
                // tags: ['Mobile'],
                tags: ['Validation workflows'],
                schemas: [/Validation/, /NestedHistory/],
            },
            parserOptions: {
                headers: [
                    {
                        domains: [process.env.ORVAL_TARGET_URL_DOMAIN || "localhost:8000"],
                        headers: {
                            Authorization: `Bearer ${process.env.API_TOKEN}`,
                            Accept: 'application/json',
                        },
                    },
                ],
            },
        },

        output: {
            mode: 'tags-split',
            client: 'react-query',
            clean: true,
            baseUrl: ORVAL_TARGET,
            workspace: './hat/assets/js/apps/Iaso/api',
            override: {
                // operations: OperationConfig.operations,
                requestOptions: {
                    credentials: 'same-origin'
                },
                query: {
                    version: 3,
                    // version: 5,
                    runtimeValidation: true,
                    shouldSplitQueryKey: true,
                    useOperationIdAsQueryKey: true,
                    useInvalidate: true,
                    mutationInvalidates: [
                        ...workflowMutationInvalidates
                    ],
                    queryOptions: {
                        path: './hat/assets/js/orval/mutator/custom-query-options.ts',
                        name: 'useCustomQueryOptions'
                    },
                    mutationOptions: {
                        path: './hat/assets/js/orval/mutator/custom-mutation-options.ts',
                        name: 'useCustomMutationOptions',
                        optionalQueryClient: true
                    }
                },
                mutator: {
                    path: '../../../orval/client/custom-fetch.ts',
                    name: 'customFetchInstance',
                    runtimeValidation: true
                },
                // fetch: {
                //     runtimeValidation: true
                // },
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
            mock: {
                type: 'msw',
                preferredContentType: 'application/json'
            },
            target: './endpoints',
            schemas: {
                type: 'zod',
                path: './models'
            },
        },

        hooks: {
            afterAllFilesWrite: [
                'eslint --cache --fix'
            ]
        }
    },

};