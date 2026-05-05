import { act, renderHook, waitFor } from '@testing-library/react';
import {
    useApiValidationWorkflowsCreate,
    useApiValidationWorkflowsRetrieve,
} from 'Iaso/api/validationWorkflows';
import { useCustomApiValidationWorkflowsList } from 'Iaso/domains/instances/validationWorkflow/api/Get';
import { QueryClientWrapperWithIntlProvider } from '../../tests/helpers';

// let user: any;
let token: any;

describe('ValidationWorkflow api e2e tests', () => {
    beforeEach(async () => {
        // clean DB
        await fetch('http://localhost:8000/api/ft-helpers/clean-database/', {
            method: 'POST',
        });

        // create user and retrieve token

        await fetch('http://localhost:8000/api/ft-helpers/create-user/', {
            method: 'POST',
        }).then(res => res.json());

        const data = await fetch('http://localhost:8000/api/token/', {
            method: 'POST',
            body: JSON.stringify({
                username: 'yoda',
                password: 'IMomLove',
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(res => res.json());

        token = data?.access;
    });

    it.skip('CRUD accordingly', async () => {
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
            created_by: 'yoda',
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
            created_by: 'yoda',
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
