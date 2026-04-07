require('dotenv').config();

module.exports = {

    api: {

        input: {
            target: `${process.env.ORVAL_TARGET_URL_PROTOCOL || "http"}://${process.env.ORVAL_TARGET_URL_DOMAIN || "localhost:8000"}/swagger/?format=json`,
            filters: {
                tags: ['Validation workflows'],
                schemas: [/Validation/],
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
            workspace: './hat/assets/js/apps/Iaso/api',
            override: {
                query: {
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
            formatter: 'prettier',
            target: './endpoints',
            schemas: {
                type: 'zod',
                path: './models',
            },
        },
    },

};
