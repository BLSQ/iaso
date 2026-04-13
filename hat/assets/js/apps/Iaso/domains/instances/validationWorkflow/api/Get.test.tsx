import { renderHook, waitFor } from '@testing-library/react';
// import { useApiValidationWorkflowsList } from 'Iaso/api';
import { useCustomApiValidationWorkflowsList } from 'Iaso/domains/instances/validationWorkflow/api/Get';
import { QueryClientWrapper } from '../../../../../../tests/helpers';

describe('useApiValidationWorkflowsList', () => {
    it('test orval rendered', async () => {
        const { result } = renderHook(
            () =>
                // useApiValidationWorkflowsList(
                useCustomApiValidationWorkflowsList(
                    { name: 'x' },
                    {
                        // query: {
                        //     retry: false,
                        //     staleTime: Infinity,
                        //     cacheTime: Infinity,
                        //     keepPreviousData: true,
                        // },
                        request: {
                            headers: {
                                Authorization: `Bearer ${process.env.API_TOKEN}`,
                            },
                        },
                    },
                ),
            { wrapper: QueryClientWrapper },
        );

        await waitFor(() =>
            expect(result.current.isSuccess || result.current.isError).toBe(
                true,
            ),
        );

        expect(result.current.isError).toBeFalsy();
        expect(result.current.data).toBeDefined();
    });
});
