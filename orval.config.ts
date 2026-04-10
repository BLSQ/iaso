require('dotenv').config();

const ORVAL_TARGET = `${process.env.ORVAL_TARGET_URL_PROTOCOL || "http"}://${process.env.ORVAL_TARGET_URL_DOMAIN || "localhost:8000"}`
module.exports = {

    api: {

        input: {
            target: new URL('/swagger/?format=json', ORVAL_TARGET).toString(),
            filters: {
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
                query: {
                    runtimeValidation: true,
                    shouldSplitQueryKey: true,
                    useOperationIdAsQueryKey: true
                },
                fetch: {
                    runtimeValidation: true
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
                {
                    command: 'cp ./hat/assets/js/apps/Iaso/api/models/index.zod.ts ./hat/assets/js/apps/Iaso/api/models/index.ts',
                    injectGeneratedDirsAndFiles: false,
                },
                'eslint --cache --fix'
            ]
        }
    },

};
