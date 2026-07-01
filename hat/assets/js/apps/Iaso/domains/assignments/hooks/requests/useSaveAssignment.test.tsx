import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseSnackMutation, mockInvalidateQueries } = vi.hoisted(() => ({
    mockUseSnackMutation: vi.fn(),
    mockInvalidateQueries: vi.fn(),
}));

vi.mock('../../../../libs/apiHooks', () => ({
    useSnackMutation: mockUseSnackMutation,
}));

vi.mock('react-query', async importOriginal => {
    const actual = await importOriginal<typeof import('react-query')>();
    return {
        ...actual,
        useQueryClient: vi.fn(() => ({
            invalidateQueries: mockInvalidateQueries,
        })),
    };
});

const EXPECTED_INVALIDATE_QUERY_KEYS = [
    'orgUnits',
    'assignmentsList',
    'planningDetails',
    'orgUnitsList',
    'planningChildrenOrgUnitsPaginated',
] as const;

describe('useSaveAssignment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseSnackMutation.mockReturnValue({ mutateAsync: vi.fn() });
    });

    it('invalidates related query keys on success', async () => {
        const { useSaveAssignment } = await import('./useSaveAssignment');

        renderHook(() =>
            useSaveAssignment({
                planningId: '42',
                assignments: { assignments: [], allAssignments: [] },
            }),
        );

        const { options } = mockUseSnackMutation.mock.calls[0][0];
        options.onSuccess();

        expect(mockInvalidateQueries).toHaveBeenCalledTimes(
            EXPECTED_INVALIDATE_QUERY_KEYS.length,
        );
        EXPECTED_INVALIDATE_QUERY_KEYS.forEach(key => {
            expect(mockInvalidateQueries).toHaveBeenCalledWith(key);
        });
    });
});

describe('useBulkSaveAssignments', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseSnackMutation.mockReturnValue({ mutateAsync: vi.fn() });
    });

    it('invalidates related query keys on success', async () => {
        const { useBulkSaveAssignments } = await import('./useSaveAssignment');

        renderHook(() => useBulkSaveAssignments());

        const { options } = mockUseSnackMutation.mock.calls[0][0];
        options.onSuccess();

        expect(mockInvalidateQueries).toHaveBeenCalledTimes(
            EXPECTED_INVALIDATE_QUERY_KEYS.length,
        );
        EXPECTED_INVALIDATE_QUERY_KEYS.forEach(key => {
            expect(mockInvalidateQueries).toHaveBeenCalledWith(key);
        });
    });
});
