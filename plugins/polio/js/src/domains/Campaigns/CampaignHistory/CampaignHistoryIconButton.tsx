import React, { FunctionComponent } from 'react';
import { Grid, Box } from '@mui/material';
import { IconButton } from 'bluesquare-components';
import MESSAGES from '../../../constants/messages';
import { Campaign } from '../../../constants/types';
import { baseUrls } from '../../../constants/urls';
import { useStyles } from '../../../styles/theme';

type Props = { selectedCampaign?: Campaign };

export const CampaignHistoryIconButton: FunctionComponent<Props> = ({
    selectedCampaign,
}) => {
    const classes: Record<string, string> = useStyles();
    if (!selectedCampaign) return null;
    return (
        <Grid
            className={classes.historyLink}
            size={{
                xs: 12,
                md: 4,
            }}
        >
            <Box
                sx={{
                    pr: 4,
                    alignItems: 'center',
                }}
            >
                <IconButton
                    url={`/${baseUrls.campaignHistory}/campaignId/${selectedCampaign?.id}`}
                    icon="history"
                    tooltipMessage={MESSAGES.campaignHistory}
                    classes={{
                        linkButton: classes.linkButton,
                    }}
                />
            </Box>
        </Grid>
    );
};
