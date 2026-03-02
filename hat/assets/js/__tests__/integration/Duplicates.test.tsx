import React from 'react';
import { useGetDuplicates } from '../../apps/Iaso/domains/entities/duplicates/hooks/api/useGetDuplicates';

// just an example on how to integrate testing without backend => using mock

vi.mock('../../apps/Iaso/domains/entities/duplicates/hooks/api/useGetDuplicates', () => ({
    useGetDuplicates: vi.fn(),
}));

describe('Duplicates page integration testing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Outputs no results when there is none', () => {
        useGetDuplicates.mockResolvedValue([]);
        // there we check by submitting that the table returns "no results", mock avoids calling the backend.
    });
});