import { useCallback, useMemo, useState } from 'react';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { usePlanningAssignments } from '../api/usePlanningAssignments';
import { useUpdateAssignments } from '../api/useUpdateAssignments';
import { getAssigneeRef, isAssignedTo } from '../api/utils';
import { useLevelOrgUnits } from '../mainPanel/useLevelOrgUnits';
import { useSelectedTeamArea } from './useSelectedTeamArea';
import {
    getAssignableOrgUnitIds,
    getOrgUnitIdsWithAssignmentsBelow,
} from './utils';

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
    const { planning, selectedLevel, currentAssignee } =
        useAssignmentsContext();
    const { data: assignments } = usePlanningAssignments(planning.id);
    const { parents } = useLevelOrgUnits(selectedLevel);
    const { areaOrgUnitIds } = useSelectedTeamArea();
    const updateAssignments = useUpdateAssignments(planning.id);
    const [pendingChange, setPendingChange] =
        useState<PendingAssignmentChange>();

    const assignableOrgUnitIds = useMemo(
        () =>
            currentAssignee && parents
                ? getAssignableOrgUnitIds(parents, areaOrgUnitIds)
                : NO_ORG_UNIT,
        [currentAssignee, parents, areaOrgUnitIds],
    );
    const orgUnitIdsWithAssignmentsBelow = useMemo(
        () =>
            getOrgUnitIdsWithAssignmentsBelow(parents ?? [], assignments ?? []),
        [parents, assignments],
    );
    const orgUnitNameById = useMemo(
        () =>
            new Map(
                (parents ?? [])
                    .flatMap(parent => parent.children)
                    .map(orgUnit => [orgUnit.id, orgUnit.name]),
            ),
        [parents],
    );

    const toggleAssignment = useCallback(
        (orgUnitId: number) => {
            if (!currentAssignee || !assignableOrgUnitIds.has(orgUnitId)) {
                return;
            }
            const assignee = getAssigneeRef(currentAssignee);
            const assignment = assignments?.find(
                ({ org_unit }) => org_unit === orgUnitId,
            );
            const isUnassign = isAssignedTo(assignment, assignee);
            const apply = () =>
                updateAssignments({
                    orgUnitIds: [orgUnitId],
                    assignee: isUnassign ? undefined : assignee,
                });
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
