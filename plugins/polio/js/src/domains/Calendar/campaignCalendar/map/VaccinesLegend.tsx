import React, { FunctionComponent } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../../../../constants/messages';
import { polioVaccines, useMapLegend } from '../../../../constants/virus';
import { useStyles } from '../Styles';

type Vaccine = (typeof polioVaccines)[number];

export const VaccinesLegend: FunctionComponent = () => {
    const classes = useStyles();
    const legend = useMapLegend();
    const { formatMessage } = useSafeIntl();
    return (
        <Paper elevation={1} className={classes.mapLegendVaccine}>
            <Box
                sx={{
                    p: 2,
                }}
            >
                <Typography
                    variant="subtitle1"
                    className={classes.mapLegendTitle}
                >
                    {formatMessage(MESSAGES.vaccines)}
                </Typography>
                {legend.map((vaccine: Vaccine) => (
                    <Box
                        key={vaccine.value}
                        sx={{
                            mt: 1,
                        }}
                    >
                        <Grid container spacing={1}>
                            <Grid
                                container
                                size={{
                                    sm: 4,
                                }}
                                sx={{
                                    justifyContent: 'flex-start',
                                }}
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
                                container
                                size={{
                                    sm: 8,
                                }}
                                sx={{
                                    justifyContent: 'flex-end',
                                    alignItems: 'center',
                                }}
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
