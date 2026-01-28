import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../constants/messages';
import { INTEGRATED_CAMPAIGN_BORDER_COLOR } from './constants';

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
        border: `2px solid ${INTEGRATED_CAMPAIGN_BORDER_COLOR}`,
        mr: 1,
    },
    typo: {
        fontSize: 12,
    },
};
export const IntegratedCampaignsLegend: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box sx={styles.root}>
            <Box sx={styles.legendSquare} />
            <Typography sx={styles.typo} variant="body2">
                {formatMessage(MESSAGES.integratedCampaign)}
            </Typography>
        </Box>
    );
};
