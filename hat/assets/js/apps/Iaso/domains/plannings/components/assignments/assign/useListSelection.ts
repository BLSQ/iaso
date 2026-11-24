import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { useUpdateAssignments } from '../api/useUpdateAssignments';
import {
    AssigneeRef,
    getAssigneeRef,
    getChangedOrgUnitIds,
} from '../api/utils';
import { OrgUnitRow } from '../mainPanel/types';
import { useConfirmPublishedChange } from './PublishedPlanningConfirmation';
import { useAssignableOrgUnits } from './useAssignableOrgUnits';

export type PendingSelectionChange = {
    clearedCount: number;
    apply: () => void;
};

export type ListSelection = {
    selectedIds: Set<number>;
    isSelectable: (row: OrgUnitRow) => boolean;
    toggle: (orgUnitId: number) => void;
    select: (rows: OrgUnitRow[]) => void;
    unselect: (rows: OrgUnitRow[]) => void;
    selectAll: () => void;
    selectUnassigned: () => void;
    unselectAll: () => void;
    assignSelected: () => void;
    unassignSelected: () => void;
    pendingChange?: PendingSelectionChange;
    cancelPendingChange: () => void;
};

const getIds = (rows: OrgUnitRow[]): number[] => rows.map(row => row.id);

// Only the shown rows the selected team's members can be given stay selected.
export const useListSelection = (rows: OrgUnitRow[]): ListSelection => {
    const { planning, selectedTeam, currentAssignee } = useAssignmentsContext();
    const {
        assignments,
        assignableOrgUnitIds,
        orgUnitIdsWithAssignmentsBelow,
    } = useAssignableOrgUnits();
    const updateAssignments = useUpdateAssignments(planning.id);
    // The selection stays when the change is cancelled.
    const confirmPublishedChange = useConfirmPublishedChange();
    const [checkedIds, setCheckedIds] = useState(new Set<number>());
    const [pendingChange, setPendingChange] =
        useState<PendingSelectionChange>();

    useEffect(() => setCheckedIds(new Set()), [selectedTeam.id]);

    const selectableRows = useMemo(
        () => rows.filter(row => assignableOrgUnitIds.has(row.id)),
        [rows, assignableOrgUnitIds],
    );
    const selectedIds = useMemo(
        () => new Set(getIds(selectableRows).filter(id => checkedIds.has(id))),
        [selectableRows, checkedIds],
    );
    const isSelectable = useCallback(
        (row: OrgUnitRow) => assignableOrgUnitIds.has(row.id),
        [assignableOrgUnitIds],
    );

    const toggle = useCallback(
        (orgUnitId: number) =>
            setCheckedIds(previous => {
                const next = new Set(previous);
                if (!next.delete(orgUnitId)) next.add(orgUnitId);
                return next;
            }),
        [],
    );
    const select = useCallback(
        (rowsToSelect: OrgUnitRow[]) =>
            setCheckedIds(
                previous =>
                    new Set([
                        ...previous,
                        ...getIds(rowsToSelect.filter(isSelectable)),
                    ]),
            ),
        [isSelectable],
    );
    const unselect = useCallback((rowsToUnselect: OrgUnitRow[]) => {
        const ids = new Set(getIds(rowsToUnselect));
        setCheckedIds(
            previous => new Set([...previous].filter(id => !ids.has(id))),
        );
    }, []);
    const selectAll = useCallback(
        () => select(selectableRows),
        [select, selectableRows],
    );
    const selectUnassigned = useCallback(
        () => select(selectableRows.filter(row => !row.assignee)),
        [select, selectableRows],
    );
    const unselectAll = useCallback(() => setCheckedIds(new Set()), []);

    // Reassigning or unassigning an org unit removes the assignments made inside it.
    const changeSelected = useCallback(
        (assignee?: AssigneeRef) => {
            const orgUnitIds = [...selectedIds];
            const apply = () =>
                confirmPublishedChange(() => {
                    updateAssignments({ orgUnitIds, assignee });
                    setCheckedIds(new Set());
                });
            const clearedCount = getChangedOrgUnitIds(
                assignments,
                orgUnitIds,
                assignee,
            ).filter(id => orgUnitIdsWithAssignmentsBelow.has(id)).length;
            if (clearedCount) {
                setPendingChange({ clearedCount, apply });
                return;
            }
            apply();
        },
        [
            selectedIds,
            assignments,
            orgUnitIdsWithAssignmentsBelow,
            confirmPublishedChange,
            updateAssignments,
        ],
    );
    const assignSelected = useCallback(() => {
        if (currentAssignee) changeSelected(getAssigneeRef(currentAssignee));
    }, [currentAssignee, changeSelected]);
    const unassignSelected = useCallback(
        () => changeSelected(),
        [changeSelected],
    );
    const cancelPendingChange = useCallback(
        () => setPendingChange(undefined),
        [],
    );

    return {
        selectedIds,
        isSelectable,
        toggle,
        select,
        unselect,
        selectAll,
        selectUnassigned,
        unselectAll,
        assignSelected,
        unassignSelected,
        pendingChange,
        cancelPendingChange,
    };
};
