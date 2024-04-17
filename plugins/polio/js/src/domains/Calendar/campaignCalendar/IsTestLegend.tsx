import { Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { SxStyles } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../constants/messages';

const styles: SxStyles = {
    root: {
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        minHeight: 30,
    },

    legendSquare: {
        width: 15,
        height: 15,
        border: '1px dashed red',
        mr: 1,
    },
    typo: {
        fontSize: 12,
    },
};
export const IsTestLegend: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box sx={styles.root}>
            <Box sx={styles.legendSquare} />
            <Typography sx={styles.typo} variant="body2">
                {formatMessage(MESSAGES.testCampaign)}
            </Typography>
        </Box>
    );
};
