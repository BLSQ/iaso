import React, { FunctionComponent } from 'react';
import { Paper, makeStyles, Box } from '@material-ui/core';

type Legend = {
    startValue: number;
    endValue: number;
    color: string;
    name: string;
    id?: string;
};

export type LegendSet = {
    name: string;
    id?: string;
    legends: Legend[];
};

export const DEFAULT_LEGEND: LegendSet = {
    name: 'Legend',
    legends: [
        {
            startValue: 90,
            endValue: 100,
            color: 'green',
            name: '> 90%',
        },
        {
            startValue: 70,
            endValue: 89,
            color: 'orange',
            name: '70% - 90%',
        },
        {
            startValue: 0,
            endValue: 69,
            color: 'red',
            name: '< 70',
        },
    ],
};

export const getLegend = (
    percent: number,
    legendSet: LegendSet = DEFAULT_LEGEND,
): Legend | undefined => {
    let currentLegend;
    legendSet.legends.forEach(legend => {
        if (percent >= legend.startValue && percent <= legend.endValue) {
            currentLegend = legend;
        }
    });

    return currentLegend;
};

const useStyles = makeStyles(theme => ({
    root: {
        position: 'absolute', // assuming you have a parent relative
        zIndex: 500,
        top: 'auto',
        left: 'auto',
        right: theme.spacing(1),
        bottom: theme.spacing(3),
        width: 'auto',
    },
    legendContainer: {
        padding: theme.spacing(2, 2, 1, 2),
    },
    legend: {
        display: 'flex',
        alignItems: 'center',
    },
    roundColor: {
        borderRadius: 20,
        height: 20,
        width: 20,
        display: 'inline-block',
        marginRight: theme.spacing(1),
    },
    mapLegendLabel: {
        textAlign: 'right',
        display: 'inline-block',
        verticalAlign: 'top',
    },
}));

type Props = {
    legendSet?: LegendSet;
};

export const MapLegend: FunctionComponent<Props> = ({
    legendSet = DEFAULT_LEGEND,
}) => {
    const classes = useStyles();

    return (
        <Paper elevation={1} className={classes.root}>
            <Box className={classes.legendContainer}>
                {legendSet.legends.map(legend => (
                    <Box
                        key={`${legend.startValue}-${legend.endValue}`}
                        mb={1}
                        className={classes.legend}
                    >
                        <span
                            className={classes.roundColor}
                            style={{ backgroundColor: legend.color }}
                        />

                        <span className={classes.mapLegendLabel}>
                            {legend.name}
                        </span>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};
