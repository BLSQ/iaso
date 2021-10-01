import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Grid, Paper, Box, Typography } from '@material-ui/core';
import { useStyles } from '../Styles';

import MESSAGES from '../../../constants/messages';

const CampaignsLegend = ({ campaigns }) => {
    const classes = useStyles();
    return (
        <Paper elevation={1} className={classes.mapLegendCampaigns}>
            <Box p={2}>
                <Typography
                    variant="subtitle1"
                    className={classes.mapLegendTitle}
                >
                    <FormattedMessage {...MESSAGES.campaigns} />
                </Typography>
                {campaigns.length === 0 && (
                    <FormattedMessage {...MESSAGES.noCampaign} />
                )}
                {campaigns.map(c => (
                    <Grid container spacing={1} key={c.campaign.id}>
                        <Grid
                            item
                            sm={3}
                            container
                            className={classes.mapLegendLabel}
                            justifyContent="flex-start"
                        >
                            <span
                                className={classes.roundColor}
                                style={{ borderColor: c.campaign.color }}
                            />
                        </Grid>
                        <Grid
                            item
                            sm={9}
                            container
                            justifyContent="flex-end"
                            alignItems="center"
                        >
                            {c.campaign.name}
                        </Grid>
                    </Grid>
                ))}
            </Box>
        </Paper>
    );
};

CampaignsLegend.propTypes = {
    campaigns: PropTypes.array.isRequired,
};

export { CampaignsLegend };
