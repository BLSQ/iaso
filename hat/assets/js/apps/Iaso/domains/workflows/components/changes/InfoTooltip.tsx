import React, { FunctionComponent } from 'react';
import { Tooltip, Box } from '@material-ui/core';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../../messages';

export const InfoTooltip: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    return (
        <Tooltip
            placement="bottom"
            title={
                <>
                    <Box>
                        {'- '}
                        {formatMessage(MESSAGES.changesInfo)}
                    </Box>
                    <Box>
                        {'- '}
                        {formatMessage(MESSAGES.changesInfo2)}
                    </Box>
                </>
            }
        >
            <InfoOutlinedIcon color="primary" fontSize="large" />
        </Tooltip>
    );
};
