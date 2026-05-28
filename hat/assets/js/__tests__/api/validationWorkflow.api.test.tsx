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
            is_staff: true,
        });
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
