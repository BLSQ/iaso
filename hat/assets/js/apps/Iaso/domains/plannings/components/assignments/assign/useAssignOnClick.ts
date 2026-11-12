import { useCallback, useMemo, useState } from 'react';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { useUpdateAssignments } from '../api/useUpdateAssignments';
import { getAssigneeRef, isAssignedTo } from '../api/utils';
import { useConfirmPublishedChange } from './PublishedPlanningConfirmation';
import { useAssignableOrgUnits } from './useAssignableOrgUnits';

export type PendingAssignmentChange = {
    orgUnitName: string;
    isUnassign: boolean;
    apply: () => void;
};

type AssignOnClick = {
    assignableOrgUnitIds: Set<number>;
    toggleAssignment: (orgUnitId: number) => void;
    pendingChange?: PendingAssignmentChange;
    cancelPendingChange: () => void;
};

const NO_ORG_UNIT = new Set<number>();

export const useAssignOnClick = (): AssignOnClick => {
    const { planning, currentAssignee } = useAssignmentsContext();
    const {
        assignments,
        assignableOrgUnitIds: assignableByTeam,
        orgUnitIdsWithAssignmentsBelow,
        orgUnitNameById,
    } = useAssignableOrgUnits();
    const updateAssignments = useUpdateAssignments(planning.id);
    const confirmPublishedChange = useConfirmPublishedChange();
    const [pendingChange, setPendingChange] =
        useState<PendingAssignmentChange>();

    const assignableOrgUnitIds = useMemo(
        () => (currentAssignee ? assignableByTeam : NO_ORG_UNIT),
        [currentAssignee, assignableByTeam],
    );

    const toggleAssignment = useCallback(
        (orgUnitId: number) => {
            if (!currentAssignee || !assignableOrgUnitIds.has(orgUnitId)) {
                return;
            }
            const assignee = getAssigneeRef(currentAssignee);
            const assignment = assignments.find(
                ({ org_unit }) => org_unit === orgUnitId,
            );
            const isUnassign = isAssignedTo(assignment, assignee);
            const apply = () =>
                confirmPublishedChange(() =>
                    updateAssignments({
                        orgUnitIds: [orgUnitId],
                        assignee: isUnassign ? undefined : assignee,
                    }),
                );
            if (orgUnitIdsWithAssignmentsBelow.has(orgUnitId)) {
                setPendingChange({
                    orgUnitName: orgUnitNameById.get(orgUnitId) ?? '',
                    isUnassign,
                    apply,
                });
                return;
            }
            apply();
        },
        [
            currentAssignee,
            assignableOrgUnitIds,
            assignments,
            orgUnitIdsWithAssignmentsBelow,
            orgUnitNameById,
            updateAssignments,
            confirmPublishedChange,
        ],
    );
    const cancelPendingChange = useCallback(
        () => setPendingChange(undefined),
        [],
    );

    return {
        assignableOrgUnitIds,
        toggleAssignment,
        pendingChange,
        cancelPendingChange,
    };
};
