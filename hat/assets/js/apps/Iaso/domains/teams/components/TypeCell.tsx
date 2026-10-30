import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';

import { Value8edEnum } from 'Iaso/api/teams';
import MESSAGES from '../messages';

type Props = {
    type?: Value8edEnum | null;
};

export const TypeCell: FunctionComponent<Props> = ({ type }) => {
    const { formatMessage } = useSafeIntl();
    if (type === Value8edEnum.enum.TEAM_OF_TEAMS) {
        return <>{formatMessage(MESSAGES.teamsOfTeams)}</>;
    }
    if (type === Value8edEnum.enum.TEAM_OF_USERS) {
        return <>{formatMessage(MESSAGES.teamsOfUsers)}</>;
    }
    return <>-</>;
};
