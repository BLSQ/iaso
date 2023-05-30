import React, { FunctionComponent } from 'react';

import { useSafeIntl, IntlFormatMessage } from 'bluesquare-components';

import { OrgUnitMarker, OrgUnitShape } from '../types/locations';

import { getDisplayName } from '../../../utils/usersUtils';
import { getParentTeam } from '../utils';

import { DropdownTeamsOptions } from '../types/team';

import MESSAGES from '../messages';

type Props = {
    item: OrgUnitShape | OrgUnitMarker;
    teams: DropdownTeamsOptions[];
};

export const AlreadyAssigned: FunctionComponent<Props> = ({ item, teams }) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    let otherAssignString = '';
    let parentTeam;
    if (item.otherAssignation?.assignedTeam) {
        parentTeam = getParentTeam({
            currentTeam: item.otherAssignation.assignedTeam,
            teams,
        });
        otherAssignString = item.otherAssignation.assignedTeam.label;
    }
    if (item.otherAssignation?.assignedUser) {
        parentTeam = getParentTeam({
            currentUser: item.otherAssignation.assignedUser,
            teams,
        });
        otherAssignString = getDisplayName(item.otherAssignation.assignedUser);
    }
    return (
        <>
            {`${formatMessage(
                MESSAGES.alreadyAssignedTo,
            )} ${otherAssignString} ${formatMessage(MESSAGES.inAnotherTeam)}${
                parentTeam && ` (${parentTeam.label})`
            }`}
        </>
    );
};
