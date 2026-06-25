import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGetParentOrgUnits } from 'Iaso/domains/assignments/hooks/requests/useGetParentOrgUnits';

const mockUseSnackQueries = vi.fn();

vi.mock('Iaso/libs/apiHooks', () => ({
    useSnackQueries: (...args: unknown[]) => mockUseSnackQueries(...args),
}));

describe('useGetParentOrgUnits', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseSnackQueries.mockReturnValue([]);
    });

    it('builds one query per parent org unit type id', () => {
        renderHook(() =>
            useGetParentOrgUnits({
                orgUniParentId: 100,
                orgUnitTypeIds: [1, 2],
            }),
        );

        expect(mockUseSnackQueries).toHaveBeenCalledWith([
            expect.objectContaining({
                queryKey: [
                    'assignments-parent-org-units',
                    expect.stringContaining('orgUnitParentId=100'),
                ],
                options: expect.objectContaining({ enabled: true }),
            }),
            expect.objectContaining({
                queryKey: [
                    'assignments-parent-org-units',
                    expect.stringContaining('orgUnitTypeId=2'),
                ],
                options: expect.objectContaining({ enabled: true }),
            }),
        ]);
    });

    it('passes an empty query list when no org unit type ids are provided', () => {
        renderHook(() =>
            useGetParentOrgUnits({
                orgUniParentId: 100,
                orgUnitTypeIds: undefined,
            }),
        );

        expect(mockUseSnackQueries).toHaveBeenCalledWith([]);
    });
});
