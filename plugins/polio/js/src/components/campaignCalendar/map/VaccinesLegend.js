import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Grid, Paper, Box, Typography } from '@material-ui/core';
import { useStyles } from '../Styles';

import MESSAGES from '../../../constants/messages';
import { polioVacines } from '../../../constants/virus';

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
                {polioVacines.map(vaccine => (
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
