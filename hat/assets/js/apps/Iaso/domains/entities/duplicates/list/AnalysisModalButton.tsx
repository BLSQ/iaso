import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';

import { Box, Button } from '@material-ui/core';
import LaunchIcon from '@material-ui/icons/Launch';
import MESSAGES from '../messages';

type Props = { onClick: () => void };

export const AnalysisModalButton: FunctionComponent<Props> = ({ onClick }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            variant="contained"
            color="primary"
            onClick={onClick}
            size="small"
        >
            <Box display="inline-block" mr={1} pt="6px">
                <LaunchIcon fontSize="small" />
            </Box>
            {formatMessage(MESSAGES.launchAnalysis)}
        </Button>
    );
};
