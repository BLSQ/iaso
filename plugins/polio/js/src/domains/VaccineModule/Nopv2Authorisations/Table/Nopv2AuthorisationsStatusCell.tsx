import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';

import { Nopv2AuthStatus } from '../types';
import MESSAGES from '../../../../constants/messages';

type Props = {
    status: Nopv2AuthStatus;
};

export const Nopv2AuthorisationsStatusCell: FunctionComponent<Props> = ({
    status,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <span style={status === 'EXPIRED' ? { color: 'red' } : undefined}>
            {MESSAGES[status.toLowerCase()]
                ? formatMessage(MESSAGES[status.toLowerCase()]).toUpperCase()
                : status}
        </span>
    );
};
