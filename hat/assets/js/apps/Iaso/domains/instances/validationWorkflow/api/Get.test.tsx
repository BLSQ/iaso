import { renderHook, waitFor } from '@testing-library/react';
import { useApiValidationWorkflowsList } from 'Iaso/api';
import { QueryClientWrapper } from '../../../../../../tests/helpers';

describe('useGetSubmissionValidationWorkflows', () => {
    it('test orval rendered', async () => {
        const { result } = renderHook(
            () =>
                useApiValidationWorkflowsList(
                    { search: 'x' },
                    {
                        query: {
                            retry: false,
                        },
                        fetch: {
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
