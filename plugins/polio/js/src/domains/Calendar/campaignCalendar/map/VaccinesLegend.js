import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Grid, Paper, Box, Typography } from '@mui/material';
import { useStyles } from '../Styles';

import MESSAGES from '../../../../constants/messages';
import { polioVaccines } from '../../../../constants/virus.ts';

const VaccinesLegend = () => {
    const classes = useStyles();
    return (
        <Paper elevation={1} className={classes.mapLegendVaccine}>
            <Box p={2}>
                <Typography
                    variant="subtitle1"
                    className={classes.mapLegendTitle}
                >
                    <FormattedMessage {...MESSAGES.vaccines} />
                </Typography>
                {polioVaccines.map(vaccine => (
                    <Grid container spacing={1} key={vaccine.value}>
                        <Grid item sm={6} container justifyContent="flex-start">
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
                ))}
            </Box>
        </Paper>
    );
};

export { VaccinesLegend };
