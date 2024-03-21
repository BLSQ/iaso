import React, { FunctionComponent } from 'react';
import {
    Grid,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useStyles } from '../Styles';

import MESSAGES from '../../../../constants/messages';
import { MappedCampaign } from '../types';

type Props = {
    campaigns: MappedCampaign[];
};

export const CampaignsLegend: FunctionComponent<Props> = ({ campaigns }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Accordion elevation={1} className={classes.mapLegendCampaigns}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography
                    variant="subtitle1"
                    className={classes.mapLegendCampaignTitle}
                >
                    {formatMessage(MESSAGES.campaigns)}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box display="block">
                    {campaigns.length === 0 &&
                        formatMessage(MESSAGES.noCampaign)}
                    {campaigns.map(c => (
                        <Grid container spacing={1} key={c.id}>
                            <Grid
                                item
                                sm={3}
                                container
                                className={classes.mapLegendLabel}
                                justifyContent="flex-start"
                            >
                                <span
                                    className={classes.roundColor}
                                    style={{
                                        borderColor: c.color,
                                    }}
                                />
                            </Grid>
                            <Grid
                                item
                                sm={9}
                                container
                                justifyContent="flex-end"
                                alignItems="center"
                            >
                                {c.name}
                            </Grid>
                        </Grid>
                    ))}
                </Box>
            </AccordionDetails>
        </Accordion>
    );
};
