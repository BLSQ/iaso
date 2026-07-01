import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';

import { TEAM_OF_TEAMS, TEAM_OF_USERS } from '../constants';
import MESSAGES from '../messages';

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
