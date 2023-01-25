import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';
import { TEAM_OF_TEAMS, TEAM_OF_USERS } from '../constants';

type Props = {
    type: string;
};

export const TypeCell: FunctionComponent<Props> = ({ type }) => {
    const { formatMessage } = useSafeIntl();
    if (type === TEAM_OF_TEAMS) {
        return <>{formatMessage(MESSAGES.teamsOfTeams)}</>;
    }
    if (type === TEAM_OF_USERS) {
        return <>{formatMessage(MESSAGES.teamsOfUsers)}</>;
    }
    return <>-</>;
};
