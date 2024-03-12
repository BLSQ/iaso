import React, { FunctionComponent } from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useStyles } from '../Styles';

import MESSAGES from '../../../../constants/messages.js';
import { polioVaccines } from '../../../../constants/virus';

type Vaccine = typeof polioVaccines[number];

const VaccinesLegend: FunctionComponent = () => {
    const classes = useStyles();
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
                {polioVaccines.map((vaccine: Vaccine) => (
                    <Box mt={1} key={vaccine.value}>
                        <Grid container spacing={1}>
                            <Grid
                                item
                                sm={6}
                                container
                                justifyContent="flex-start"
                            >
                                <span
                                    className={classes.roundColor}
                                    style={{ backgroundColor: vaccine.color }}
                                />
                            </Grid>
                            <Grid
                                item
                                sm={6}
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

export { VaccinesLegend };
