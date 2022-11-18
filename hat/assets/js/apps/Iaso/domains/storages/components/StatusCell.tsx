import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

import { StorageStatus } from '../types/storages';

type Props = {
    status: StorageStatus;
};

export const StatusCell: FunctionComponent<Props> = ({ status }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            {status ? formatMessage(MESSAGES[`${status.status}`]) : '--'}
            {status.reason &&
                ` (${formatMessage(MESSAGES.reason)}: ${status.reason})`}
        </>
    );
};
