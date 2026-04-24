import { act, renderHook, waitFor } from '@testing-library/react';
import {
    useApiValidationWorkflowsCreate,
    useApiValidationWorkflowsRetrieve,
} from 'Iaso/api';
import { useCustomApiValidationWorkflowsList } from 'Iaso/domains/instances/validationWorkflow/api/Get';
import { QueryClientWrapperWithIntlProvider } from '../../tests/helpers';

// let user: any;
// let token: any;

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

        token = await fetch('http://localhost:8000/api/token/', {
            method: 'POST',
            body: JSON.stringify({
                username: 'yoda',
                password: 'IMomLove',
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(res => res.json());

        // console.log(token);
    });

    it('CRUD accordingly', async () => {
        const { result: resultList, rerender: rerenderList } = renderHook(
            () =>
                // useApiValidationWorkflowsList(
                useCustomApiValidationWorkflowsList(
                    {},
                    {
                        request: {
                            headers: {
                                Authorization: `Bearer ${process.env.API_TOKEN}`,
                            },
                        },
                    },
                ),
            { wrapper: QueryClientWrapperWithIntlProvider },
        );

        await waitFor(() =>
            expect(
                resultList.current.isSuccess || resultList.current.isError,
            ).toBe(true),
        );

        // expect(result.current.data).toBe([]);

        // create validation workflow
        const { result: resultCreate } = renderHook(
            () =>
                useApiValidationWorkflowsCreate({
                    request: {
                        headers: {
                            Authorization: `Bearer ${process.env.API_TOKEN}`,
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

        rerenderList({});

        await waitFor(() => expect(resultList.current.isSuccess).toBe(true));

        expect(resultList.current.data).toBe({
            count: 2,
            results: [{}],
        });

        // retrieve
        const { result: resultRetrieve } = renderHook(
            () => useApiValidationWorkflowsRetrieve('test-validation-workflow'),
            { wrapper: QueryClientWrapperWithIntlProvider },
        );

        await waitFor(() => {
            expect(resultRetrieve.current.isSuccess).toBe(true);
        });

        expect(resultRetrieve.current.data).toBe({});

        // update

        // delete
    });
});
