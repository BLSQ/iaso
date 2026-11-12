import { useCallback, useMemo, useState } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import MESSAGES from '../../../messages';
import { getAssigneeRef, isAssignedTo } from '../api/utils';
import { TeamMemberRowData } from '../teamsPanel/types';
import { useAssignableOrgUnits } from './useAssignableOrgUnits';
import { useUnassignOrgUnits } from './useUnassignOrgUnits';
import { getOrgUnitIdsAssignedTo } from './utils';

type PendingRemoval = {
    title: string;
    text: string;
    orgUnitIds: number[];
};

type MemberAssignments = {
    getAssignedCount: (row: TeamMemberRowData) => number;
    requestRemoval: (memberKey: string) => void;
    pendingRemoval?: PendingRemoval;
    confirmRemoval: () => void;
    cancelRemoval: () => void;
};

export const useMemberAssignments = (): MemberAssignments => {
    const { formatMessage } = useSafeIntl();
    const { selectedTeam, selectedTeamMembers } = useAssignmentsContext();
    const { assignments, assignableOrgUnitIds } = useAssignableOrgUnits();
    const unassignOrgUnits = useUnassignOrgUnits();
    const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval>();

    // Exact for the selected team's members; other members count all their assignments of the planning.
    const getAssignedCount = useCallback(
        (row: TeamMemberRowData) => {
            const assignee = getAssigneeRef(row);
            return row.parentTeam.id === selectedTeam.id
                ? getOrgUnitIdsAssignedTo(
                      assignments,
                      assignee,
                      assignableOrgUnitIds,
                  ).length
                : assignments.filter(assignment =>
                      isAssignedTo(assignment, assignee),
                  ).length;
        },
        [assignments, assignableOrgUnitIds, selectedTeam.id],
    );

    const memberByKey = useMemo(
        () => new Map(selectedTeamMembers.map(member => [member.key, member])),
        [selectedTeamMembers],
    );
    const requestRemoval = useCallback(
        (memberKey: string) => {
            const member = memberByKey.get(memberKey);
            if (!member) return;
            const orgUnitIds = getOrgUnitIdsAssignedTo(
                assignments,
                getAssigneeRef(member),
                assignableOrgUnitIds,
            );
            const text = formatMessage(MESSAGES.removeMemberAssignmentsText, {
                count: `${orgUnitIds.length}`,
                member: member.name,
            });
            setPendingRemoval({
                title: formatMessage(MESSAGES.removeAssignments),
                text: member.team
                    ? `${text} ${formatMessage(
                          MESSAGES.removeTeamAssignmentsBelowText,
                          { member: member.name },
                      )}`
                    : text,
                orgUnitIds,
            });
        },
        [memberByKey, assignments, assignableOrgUnitIds, formatMessage],
    );
    const cancelRemoval = useCallback(() => setPendingRemoval(undefined), []);
    const confirmRemoval = useCallback(() => {
        if (pendingRemoval) unassignOrgUnits(pendingRemoval.orgUnitIds);
        setPendingRemoval(undefined);
    }, [pendingRemoval, unassignOrgUnits]);

    return {
        getAssignedCount,
        requestRemoval,
        pendingRemoval,
        confirmRemoval,
        cancelRemoval,
    };
};
