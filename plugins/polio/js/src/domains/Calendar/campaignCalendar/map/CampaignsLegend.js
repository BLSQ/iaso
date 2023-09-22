import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import {
    Grid,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { useStyles } from '../Styles';

import MESSAGES from '../../../../constants/messages';

const CampaignsLegend = ({ campaigns }) => {
    const classes = useStyles();
    return (
        <Accordion elevation={1} className={classes.mapLegendCampaigns}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography
                    variant="subtitle1"
                    className={classes.mapLegendCampaignTitle}
                >
                    <FormattedMessage {...MESSAGES.campaigns} />
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box display="block">
                    {campaigns.length === 0 && (
                        <FormattedMessage {...MESSAGES.noCampaign} />
                    )}
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

CampaignsLegend.propTypes = {
    campaigns: PropTypes.array.isRequired,
};

export { CampaignsLegend };
