import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useClearRootOrgUnitOutsideProject } from './useClearRootOrgUnitOutsideProject';
import { PlanningFormik } from './usePlanningForm';

const { mockUseProjectOrgUnitTypeIds, mockUseGetPlanningRootOrgUnit } =
    vi.hoisted(() => ({
        mockUseProjectOrgUnitTypeIds: vi.fn(),
        mockUseGetPlanningRootOrgUnit: vi.fn(),
    }));

vi.mock('./useProjectOrgUnitTypeIds', () => ({
    useProjectOrgUnitTypeIds: mockUseProjectOrgUnitTypeIds,
}));

vi.mock('./requests/useGetPlanningRootOrgUnit', () => ({
    useGetPlanningRootOrgUnit: mockUseGetPlanningRootOrgUnit,
}));

const ROOT_ORG_UNIT_ID = 10;
const ROOT_ORG_UNIT_TYPE_ID = 7;

type HookProps = {
    project?: number | null;
    selectedOrgUnit?: number | null;
};

const setFieldValue = vi.fn();
const setFieldTouched = vi.fn();

const renderClearHook = (initialProps: HookProps) =>
    renderHook(
        ({ project, selectedOrgUnit }: HookProps) =>
            useClearRootOrgUnitOutsideProject({
                values: { project, selectedOrgUnit },
                setFieldValue,
                setFieldTouched,
            } as unknown as PlanningFormik),
        { initialProps },
    );

const mockProjectTypes = (
    orgUnitTypeIds: number[] | undefined,
    isFetching = false,
) =>
    mockUseProjectOrgUnitTypeIds.mockReturnValue({
        orgUnitTypeIds,
        isFetching,
    });

const mockRootOrgUnit = (
    id = ROOT_ORG_UNIT_ID,
    orgUnitTypeId = ROOT_ORG_UNIT_TYPE_ID,
) =>
    mockUseGetPlanningRootOrgUnit.mockReturnValue({
        data: { id, org_unit_type_id: orgUnitTypeId },
    });

const getFormUpdates = () => ({
    touched: setFieldTouched.mock.calls,
    values: setFieldValue.mock.calls,
});

const CLEARED = {
    touched: [['selectedOrgUnit', false]],
    values: [['selectedOrgUnit', null]],
};

const NOT_CLEARED = { touched: [], values: [] };

describe('useClearRootOrgUnitOutsideProject', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockProjectTypes([ROOT_ORG_UNIT_TYPE_ID]);
        mockRootOrgUnit();
    });

    it('passes the project and selected org unit to the underlying queries', () => {
        renderClearHook({ project: 1, selectedOrgUnit: ROOT_ORG_UNIT_ID });

        expect(mockUseProjectOrgUnitTypeIds).toHaveBeenCalledWith(1);
        expect(mockUseGetPlanningRootOrgUnit).toHaveBeenCalledWith(
            ROOT_ORG_UNIT_ID,
        );
    });

    it('does not clear an already saved root org unit outside the project on mount', () => {
        mockProjectTypes([99]);

        renderClearHook({ project: 1, selectedOrgUnit: ROOT_ORG_UNIT_ID });

        expect(getFormUpdates()).toEqual(NOT_CLEARED);
    });

    it('clears the root org unit when the new project does not include its type', () => {
        const { rerender } = renderClearHook({
            project: 1,
            selectedOrgUnit: ROOT_ORG_UNIT_ID,
        });

        mockProjectTypes([99]);
        rerender({ project: 2, selectedOrgUnit: ROOT_ORG_UNIT_ID });

        expect(getFormUpdates()).toEqual(CLEARED);
    });

    it('keeps the root org unit when the new project includes its type', () => {
        const { rerender } = renderClearHook({
            project: 1,
            selectedOrgUnit: ROOT_ORG_UNIT_ID,
        });

        mockProjectTypes([ROOT_ORG_UNIT_TYPE_ID, 99]);
        rerender({ project: 2, selectedOrgUnit: ROOT_ORG_UNIT_ID });

        expect(getFormUpdates()).toEqual(NOT_CLEARED);
    });

    it('waits for the project org unit types to be fetched before clearing', () => {
        const { rerender } = renderClearHook({
            project: 1,
            selectedOrgUnit: ROOT_ORG_UNIT_ID,
        });

        mockProjectTypes([99], true);
        rerender({ project: 2, selectedOrgUnit: ROOT_ORG_UNIT_ID });
        expect(getFormUpdates()).toEqual(NOT_CLEARED);

        mockProjectTypes(undefined);
        rerender({ project: 2, selectedOrgUnit: ROOT_ORG_UNIT_ID });
        expect(getFormUpdates()).toEqual(NOT_CLEARED);

        mockProjectTypes([99]);
        rerender({ project: 2, selectedOrgUnit: ROOT_ORG_UNIT_ID });
        expect(getFormUpdates()).toEqual(CLEARED);
    });

    it('waits for the root org unit matching the selection before clearing', () => {
        const { rerender } = renderClearHook({
            project: 1,
            selectedOrgUnit: ROOT_ORG_UNIT_ID,
        });

        mockProjectTypes([99]);
        mockRootOrgUnit(ROOT_ORG_UNIT_ID + 1);
        rerender({ project: 2, selectedOrgUnit: ROOT_ORG_UNIT_ID });
        expect(getFormUpdates()).toEqual(NOT_CLEARED);

        mockRootOrgUnit();
        rerender({ project: 2, selectedOrgUnit: ROOT_ORG_UNIT_ID });
        expect(getFormUpdates()).toEqual(CLEARED);
    });

    it('does nothing when the project is removed', () => {
        const { rerender } = renderClearHook({
            project: 1,
            selectedOrgUnit: ROOT_ORG_UNIT_ID,
        });

        mockProjectTypes(undefined);
        rerender({ project: null, selectedOrgUnit: ROOT_ORG_UNIT_ID });

        expect(getFormUpdates()).toEqual(NOT_CLEARED);
    });

    it('does nothing when the project changes without a selected root org unit', () => {
        const { rerender } = renderClearHook({
            project: 1,
            selectedOrgUnit: null,
        });

        mockProjectTypes([99]);
        rerender({ project: 2, selectedOrgUnit: null });

        expect(getFormUpdates()).toEqual(NOT_CLEARED);
    });

    it('does not re-check the root org unit once the project change has been handled', () => {
        const { rerender } = renderClearHook({
            project: 1,
            selectedOrgUnit: ROOT_ORG_UNIT_ID,
        });

        rerender({ project: 2, selectedOrgUnit: ROOT_ORG_UNIT_ID });
        expect(getFormUpdates()).toEqual(NOT_CLEARED);

        mockProjectTypes([99]);
        rerender({ project: 2, selectedOrgUnit: ROOT_ORG_UNIT_ID });

        expect(getFormUpdates()).toEqual(NOT_CLEARED);
    });

    it('does not clear a root org unit picked after a project change without selection', () => {
        const { rerender } = renderClearHook({
            project: 1,
            selectedOrgUnit: null,
        });

        mockProjectTypes([99]);
        rerender({ project: 2, selectedOrgUnit: null });
        rerender({ project: 2, selectedOrgUnit: ROOT_ORG_UNIT_ID });

        expect(getFormUpdates()).toEqual(NOT_CLEARED);
    });
});
