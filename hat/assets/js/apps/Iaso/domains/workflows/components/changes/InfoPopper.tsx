import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';

import { InfoPopper } from '../../../app/components/InfoPopper';

import MESSAGES from '../../messages';

export const Popper: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    return (
        <InfoPopper>
            <Box>
                {'- '}
                {formatMessage(MESSAGES.changesInfo)}
            </Box>
            <Box>
                {'- '}
                {formatMessage(MESSAGES.changesInfo2)}
            </Box>
        </InfoPopper>
    );
};
