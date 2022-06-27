import React, { FunctionComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Grid, Paper, Box, Typography, makeStyles } from '@material-ui/core';

import {
    unSelectedColor,
    disabledColor,
    parentColor,
} from '../constants/colors';

import MESSAGES from '../../../constants/messages';

const polioVacines = [
    {
        value: 'unselected',
        label: 'unselected',
        color: unSelectedColor,
    },
    {
        value: 'disabled',
        label: 'disabled',
        color: disabledColor,
    },
    {
        value: 'parent',
        label: 'parent',
        color: parentColor,
    },
];
export const useStyles = makeStyles(theme => ({
    root: {
        position: 'absolute',
        zIndex: 499,
        fontSize: 10,
        bottom: theme.spacing(3),
        right: theme.spacing(2),
    },
    mapLegendTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: theme.spacing(1),
    },
    roundColor: {
        borderRadius: theme.spacing(3),
        height: theme.spacing(3),
        width: theme.spacing(3),
        // @ts-ignore
        border: `2px solid ${theme.palette.ligthGray.border}`,
    },
}));

export const MapLegend: FunctionComponent = () => {
    const classes = useStyles();
    return (
        <Paper elevation={1} className={classes.root}>
            <Box p={2}>
                <Typography
                    variant="subtitle1"
                    className={classes.mapLegendTitle}
                >
                    <FormattedMessage {...MESSAGES.legend} />
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
