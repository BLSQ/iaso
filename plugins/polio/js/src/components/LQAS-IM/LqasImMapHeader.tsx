import React, { FunctionComponent } from 'react';
import { Typography, Box } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';
import { RoundString } from '../../constants/types';

type Props = {
    round: RoundString;
};

export const LqasImMapHeader: FunctionComponent<Props> = ({ round }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box>
            <Typography variant="h5">
                {`${formatMessage(MESSAGES[round])}`}
            </Typography>
        </Box>
    );
};
