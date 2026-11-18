import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDeleteRequest, mockUseSnackMutation } = vi.hoisted(() => ({
    mockDeleteRequest: vi.fn(),
    mockUseSnackMutation: vi.fn(),
}));

vi.mock('Iaso/libs/Api', () => ({
    deleteRequest: mockDeleteRequest,
}));

vi.mock('Iaso/libs/apiHooks', () => ({
    useSnackMutation: mockUseSnackMutation,
}));

import { useRemovePage } from './useRemovePage';

describe('useRemovePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deletes the page slug and invalidates the pages query', () => {
        useRemovePage();
        const [mutationFn, successMessage, errorMessage, invalidateQueryKey] =
            mockUseSnackMutation.mock.calls[0];

        mutationFn('home');

        expect(mockDeleteRequest).toHaveBeenCalledWith('/api/pages/home');
        expect(successMessage.id).toBe('iaso.page.deleteSuccess');
        expect(errorMessage.id).toBe('iaso.page.deleteError');
        expect(invalidateQueryKey).toEqual(['iaso', 'pages']);
    });
});
