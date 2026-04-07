import { renderHook, waitFor } from '@testing-library/react';
import { useGetSubmissionValidationWorkflows } from 'Iaso/domains/instances/validationWorkflow/api/Get';
import { QueryClientWrapper } from '../../../../../../tests/helpers';

describe('useGetSubmissionValidationWorkflows', () => {
    it('fetches workflows from the real backend', async () => {
        const { result } = renderHook(
            () => useGetSubmissionValidationWorkflows({ limit: 5 }),
            { wrapper: QueryClientWrapper },
        );

        // Wait until the query is successful
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toBeDefined();
        // expect(Array.isArray(result.current.data.items)).toBe(true);
        // console.log(result.current.data.items); // Optional: inspect data
    });
});
