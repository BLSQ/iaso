import { Box, Grid, Paper, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { useStyles } from '../Styles';

import MESSAGES from '../../../../constants/messages';
import { polioVaccines, useMapLegend } from '../../../../constants/virus';

// eslint-disable-next-line prettier/prettier
type Vaccine = (typeof polioVaccines)[number];

export const VaccinesLegend: FunctionComponent = () => {
    const classes = useStyles();
    const legend = useMapLegend();
    const { formatMessage } = useSafeIntl();
    return (
        <Paper elevation={1} className={classes.mapLegendVaccine}>
            <Box p={2}>
                <Typography
                    variant="subtitle1"
                    className={classes.mapLegendTitle}
                >
                    {formatMessage(MESSAGES.vaccines)}
                </Typography>
                {legend.map((vaccine: Vaccine) => (
                    <Box mt={1} key={vaccine.value}>
                        <Grid container spacing={1}>
                            <Grid
                                item
                                sm={4}
                                container
                                justifyContent="flex-start"
                            >
                                <span
                                    className={classes.roundColor}
                                    style={{
                                        background:
                                            vaccine.legendColor ||
                                            vaccine.color,
                                    }}
                                />
                            </Grid>
                            <Grid
                                item
                                sm={8}
                                container
                                justifyContent="flex-end"
                                alignItems="center"
                            >
                                {vaccine.label}
                            </Grid>
                        </Grid>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};
