import React, { FunctionComponent } from 'react';
import { Grid, Paper, Typography, makeStyles, Box } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';

import { IntlMessage } from '../../types/intl';

const useStyles = makeStyles(theme => ({
    root: {
        width: 200,
        marginTop: theme.spacing(2),
        position: 'absolute', // assuming you have a parent relative
        zIndex: 1000,
        right: theme.spacing(2),
        top: 0,
    },
    mapLegendTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: theme.spacing(1),
    },
    roundColor: {
        borderRadius: theme.spacing(2),
        height: theme.spacing(2),
        width: theme.spacing(2),
    },
    mapLegendLabel: {
        textAlign: 'right',
    },
    mapLegendText: {
        fontWeight: 'bold',
    },
}));

type Legend = {
    value: string;
    label: string;
    color: string; // has to be an hexa color
};

type Props = {
    titleMessage?: IntlMessage;
    options: Array<Legend>;
};

export const MapLegend: FunctionComponent<Props> = ({
    titleMessage,
    options,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Paper elevation={1} className={classes.root}>
            <Box p={2}>
                {titleMessage && (
                    <Typography
                        variant="subtitle1"
                        className={classes.mapLegendTitle}
                    >
                        {formatMessage(titleMessage)}
                    </Typography>
                )}
                <Grid container spacing={1}>
                    {options.map((o, i) => (
                        <Box
                            key={o.value}
                            mb={i + 1 === options.length ? 0 : 1}
                            width="100%"
                            display="flex"
                            justifyContent="flex-start"
                        >
                            <Grid
                                item
                                sm={2}
                                container
                                justifyContent="flex-start"
                            >
                                <span
                                    className={classes.roundColor}
                                    style={{ backgroundColor: o.color }}
                                />
                            </Grid>
                            <Grid item sm={10} container alignItems="center">
                                {o.label}
                            </Grid>
                        </Box>
                    ))}
                </Grid>
            </Box>
        </Paper>
    );
};

MapLegend.defaultProps = {
    titleMessage: undefined,
};
