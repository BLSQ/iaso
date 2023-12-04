import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Grid, Paper, Box, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

import {
    unSelectedColor,
    disabledColor,
    parentColor,
} from '../constants/colors';

import MESSAGES from '../../../constants/messages';

type Legend = {
    value: string;
    labelKey: string;
    color: string;
};

const legends: Legend[] = [
    {
        value: 'unselected',
        labelKey: 'unselected',
        color: unSelectedColor,
    },
    {
        value: 'disabled',
        labelKey: 'disabled',
        color: disabledColor,
    },
    {
        value: 'parent',
        labelKey: 'parent',
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
    row: {
        marginBottom: theme.spacing(1),
    },
}));

export const MapLegend: FunctionComponent = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Paper elevation={1} className={classes.root}>
            <Box p={2}>
                <Typography
                    variant="subtitle1"
                    className={classes.mapLegendTitle}
                >
                    {formatMessage(MESSAGES.legend)}
                </Typography>
                {legends.map(vaccine => (
                    <Grid
                        container
                        spacing={1}
                        key={vaccine.value}
                        className={classes.row}
                    >
                        <Grid item sm={4} container justifyContent="flex-start">
                            <span
                                className={classes.roundColor}
                                style={{ backgroundColor: vaccine.color }}
                            />
                        </Grid>
                        <Grid
                            item
                            sm={8}
                            container
                            justifyContent="flex-start"
                            alignItems="center"
                        >
                            {formatMessage(MESSAGES[vaccine.labelKey])}
                        </Grid>
                    </Grid>
                ))}
            </Box>
        </Paper>
    );
};
