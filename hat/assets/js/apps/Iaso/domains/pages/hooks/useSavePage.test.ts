import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPostRequest, mockPutRequest, mockUseSnackMutation } = vi.hoisted(
    () => ({
        mockPostRequest: vi.fn(),
        mockPutRequest: vi.fn(),
        mockUseSnackMutation: vi.fn(),
    }),
);

vi.mock('Iaso/libs/Api', () => ({
    postRequest: mockPostRequest,
    putRequest: mockPutRequest,
}));

vi.mock('Iaso/libs/apiHooks', () => ({
    useSnackMutation: mockUseSnackMutation,
}));

import { useSavePage } from './useSavePage';

describe('useSavePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('updates a page that already has an id and creates one that does not', () => {
        useSavePage();
        const mutationFn = mockUseSnackMutation.mock.calls[0][0];

        mutationFn({ id: 4, name: 'Home' });
        mutationFn({ name: 'New' });

        expect(mockPutRequest).toHaveBeenCalledWith('/api/pages/4/', {
            id: 4,
            name: 'Home',
        });
        expect(mockPostRequest).toHaveBeenCalledWith('/api/pages/', {
            name: 'New',
        });
        expect(mockUseSnackMutation.mock.calls[0][3]).toEqual([
            'iaso',
            'pages',
        ]);
    });
});
