import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectOrgUnitTypeIds } from './useProjectOrgUnitTypeIds';

const { mockUseGetOrgUnitTypesDropdownOptions } = vi.hoisted(() => ({
    mockUseGetOrgUnitTypesDropdownOptions: vi.fn(),
}));

vi.mock(
    'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions',
    () => ({
        useGetOrgUnitTypesDropdownOptions:
            mockUseGetOrgUnitTypesDropdownOptions,
    }),
);

const makeOption = (id: number) => ({
    value: `${id}`,
    label: `Type ${id}`,
    original: { id, name: `Type ${id}`, sub_unit_types: [] },
});

describe('useProjectOrgUnitTypeIds', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetOrgUnitTypesDropdownOptions.mockReturnValue({
            data: undefined,
            isFetching: false,
        });
    });

    it('enables the query filtered on the project when a project is given', () => {
        renderHook(() => useProjectOrgUnitTypeIds(3));

        expect(mockUseGetOrgUnitTypesDropdownOptions).toHaveBeenCalledWith({
            projectId: 3,
            enabled: true,
        });
    });

    it.each([undefined, null])(
        'disables the query without project id when project is %s',
        projectId => {
            renderHook(() => useProjectOrgUnitTypeIds(projectId));

            expect(mockUseGetOrgUnitTypesDropdownOptions).toHaveBeenCalledWith({
                projectId: undefined,
                enabled: false,
            });
        },
    );

    it('maps dropdown options to their original org unit type ids', () => {
        mockUseGetOrgUnitTypesDropdownOptions.mockReturnValue({
            data: [makeOption(1), makeOption(5)],
            isFetching: false,
        });

        const { result } = renderHook(() => useProjectOrgUnitTypeIds(3));

        expect(result.current).toEqual({
            orgUnitTypeIds: [1, 5],
            isFetching: false,
        });
    });

    it('returns undefined ids and forwards isFetching while data is loading', () => {
        mockUseGetOrgUnitTypesDropdownOptions.mockReturnValue({
            data: undefined,
            isFetching: true,
        });

        const { result } = renderHook(() => useProjectOrgUnitTypeIds(3));

        expect(result.current).toEqual({
            orgUnitTypeIds: undefined,
            isFetching: true,
        });
    });

    it('keeps the same ids reference across renders when data is unchanged', () => {
        const data = [makeOption(1)];
        mockUseGetOrgUnitTypesDropdownOptions.mockReturnValue({
            data,
            isFetching: false,
        });

        const { result, rerender } = renderHook(() =>
            useProjectOrgUnitTypeIds(3),
        );
        const firstIds = result.current.orgUnitTypeIds;
        rerender();

        expect(result.current.orgUnitTypeIds).toBe(firstIds);
    });
});
