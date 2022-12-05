import React, { FunctionComponent } from 'react';

import { Tooltip, Typography } from '@material-ui/core';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { getDefaultSourceVersion } from '../../../domains/dataSources/utils';
import { User } from '../../../utils/usersUtils';
import MESSAGES from '../../../domains/app/components/messages';

type Props = {
    currentUser: User;
};

export const CurrentUserInfos: FunctionComponent<Props> = ({ currentUser }) => {
    const { formatMessage } = useSafeIntl();
    const defaultSourceVersion = getDefaultSourceVersion(currentUser);

    return (
        <Tooltip
            placement="bottom"
            title={`${formatMessage(MESSAGES.source)}: ${
                (defaultSourceVersion.source &&
                    defaultSourceVersion.source.name) ||
                '-'
            }, ${formatMessage(MESSAGES.version)} ${
                (defaultSourceVersion.version &&
                    defaultSourceVersion.version.number) ||
                '-'
            }`}
        >
            <div>
                <Typography variant="body2">
                    {currentUser?.user_name}
                </Typography>

                <Typography variant="body2">
                    {currentUser?.account?.name}
                </Typography>
            </div>
        </Tooltip>
    );
};
