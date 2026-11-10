import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FormsParams } from '../types/forms';
import { shouldShowDeletedColumn, useFormsTableColumns } from './index';

const mockGetProjectChips = vi.fn();
const mockGetOrgUnitTypeChips = vi.fn();

vi.mock('../../projects/hooks/useGetProjectChips', () => ({
    useGetProjectChips: () => mockGetProjectChips,
}));

vi.mock('../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypeChips', () => ({
    useGetOrgUnitTypeChips: () => mockGetOrgUnitTypeChips,
}));

vi.mock('../../../utils/usersUtils', () => ({
    useCurrentUser: () => ({ id: 1 }),
}));

vi.mock('../../users/utils', () => ({
    userHasAccessToModule: () => false,
    userHasOneOfPermissions: () => false,
    userHasPermission: () => false,
}));

vi.mock('../hooks/useDeleteForm', () => ({
    useDeleteForm: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { defaultMessage?: string; id?: string }) =>
                msg.defaultMessage || msg.id,
        }),
    };
});

const defaultParams = {
    pageSize: '10',
    order: 'name',
    page: '1',
    orgUnitId: '',
} as FormsParams;

describe('shouldShowDeletedColumn', () => {
    it('shows deleted_at in onlyDeleted mode', () => {
        expect(shouldShowDeletedColumn(true, false)).toBe(true);
    });

    it('shows deleted_at in showDeleted mode', () => {
        expect(shouldShowDeletedColumn(false, true)).toBe(true);
    });

    it('hides deleted_at when no deleted filter is active', () => {
        expect(shouldShowDeletedColumn(false, false)).toBe(false);
    });
});

describe('useFormsTableColumns', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('passes the row projects to useGetProjectChips', () => {
        mockGetProjectChips.mockReturnValue('chips');
        const { result } = renderHook(() =>
            useFormsTableColumns({
                orgUnitId: '',
                onlyDeleted: false,
                showDeleted: false,
                params: defaultParams,
                count: 0,
            }),
        );

        const projectsCol = result.current.find(col => col.id === 'projects');
        const projects = [{ id: 1, name: 'Census' }];
        expect(
            projectsCol?.Cell?.({ row: { original: { projects } } }),
        ).toBe('chips');
        expect(mockGetProjectChips).toHaveBeenCalledWith(projects);
    });

    it('passes the row org unit types to useGetOrgUnitTypeChips', () => {
        mockGetOrgUnitTypeChips.mockReturnValue('type-chips');
        const { result } = renderHook(() =>
            useFormsTableColumns({
                orgUnitId: '',
                onlyDeleted: false,
                showDeleted: false,
                params: defaultParams,
                count: 0,
            }),
        );

        const typesCol = result.current.find(col => col.id === 'org_unit_types');
        const orgUnitTypes = [{ id: 1, short_name: 'DIST', name: 'District' }];
        expect(
            typesCol?.Cell?.({ row: { original: { org_unit_types: orgUnitTypes } } }),
        ).toBe('type-chips');
        expect(mockGetOrgUnitTypeChips).toHaveBeenCalledWith(orgUnitTypes);
    });
});
