import React, { FunctionComponent } from 'react';
import LaunchIcon from '@mui/icons-material/Launch';
import Box from '@mui/material/Box/Box';
import Button from '@mui/material/Button/Button';
import { useSafeIntl } from 'bluesquare-components';

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
