import { useCallback, useMemo, useState } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import MESSAGES from '../../../messages';
import { getAssigneeRef, isAssignedTo } from '../api/utils';
import { TeamMemberRowData } from '../teamsPanel/types';
import { useAssignableOrgUnits } from './useAssignableOrgUnits';
import { useChangeAssignments } from './useChangeAssignments';
import { getOrgUnitIdsAssignedTo } from './utils';

type MemberAssignments = {
    getAssignedCount: (row: TeamMemberRowData) => number;
    requestRemoval: (memberKey: string) => void;
    removalText?: string;
    confirmRemoval: () => void;
    cancelRemoval: () => void;
};

export const useMemberAssignments = (): MemberAssignments => {
    const { formatMessage } = useSafeIntl();
    const { selectedTeam, selectedTeamMembers } = useAssignmentsContext();
    const { assignments, assignableOrgUnitIds } = useAssignableOrgUnits();
    const changeAssignments = useChangeAssignments();
    const [removedMemberKey, setRemovedMemberKey] = useState<string>();

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

    const removedMember = selectedTeamMembers.find(
        member => member.key === removedMemberKey,
    );
    const removedOrgUnitIds = useMemo(
        () =>
            removedMember
                ? getOrgUnitIdsAssignedTo(
                      assignments,
                      getAssigneeRef(removedMember),
                      assignableOrgUnitIds,
                  )
                : [],
        [removedMember, assignments, assignableOrgUnitIds],
    );
    const removalText = useMemo(() => {
        if (!removedMember) return undefined;
        const text = formatMessage(MESSAGES.removeMemberAssignmentsText, {
            count: `${removedOrgUnitIds.length}`,
            member: removedMember.name,
        });
        return removedMember.team
            ? `${text} ${formatMessage(
                  MESSAGES.removeTeamAssignmentsBelowText,
                  {
                      member: removedMember.name,
                  },
              )}`
            : text;
    }, [removedMember, removedOrgUnitIds, formatMessage]);

    const cancelRemoval = useCallback(() => setRemovedMemberKey(undefined), []);
    const confirmRemoval = useCallback(() => {
        changeAssignments({ orgUnitIds: removedOrgUnitIds });
        setRemovedMemberKey(undefined);
    }, [removedOrgUnitIds, changeAssignments]);

    return {
        getAssignedCount,
        requestRemoval: setRemovedMemberKey,
        removalText,
        confirmRemoval,
        cancelRemoval,
    };
};
