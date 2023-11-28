import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';

import { Box, Button } from '@material-ui/core';
import { Autorenew } from '@material-ui/icons';
import MESSAGES from '../messages';
// import { Analysis } from '../types';

type Props = { onClick: () => void };

export const AnalysisModalButton: FunctionComponent<Props> = ({ onClick }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            // disabled={!latestAnalysis.finished_at || isSaving}
            variant="contained"
            color="primary"
            onClick={onClick}
            size="small"
        >
            <Box display="inline-block" mr={1} pt="6px">
                <Autorenew fontSize="small" />
            </Box>
            {formatMessage(MESSAGES.relaunchAnalysis)}
        </Button>
    );
};
