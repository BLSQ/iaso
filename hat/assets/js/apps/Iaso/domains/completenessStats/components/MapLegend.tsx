import React, { FunctionComponent } from 'react';
import { Paper, Box, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { scaleThreshold } from '@visx/scale';
import { LegendThreshold, LegendItem, LegendLabel } from '@visx/legend';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

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
}));

export const getLegend = scaleThreshold({
    domain: [70, 90],
    range: ['red', 'orange', 'green'],
});

const legendLabels: string[] = ['< 70', '70% - 90%', '> 90%'];

export const getDirectLegend = scaleThreshold({
    domain: [100],
    range: ['red', 'green'],
});

const useGetDirectLabels = (): string[] => {
    const { formatMessage } = useSafeIntl();
    return [
        formatMessage(MESSAGES.notCompleted),
        formatMessage(MESSAGES.completed),
    ];
};

type Props = {
    showDirectCompleteness: boolean;
};

export const MapLegend: FunctionComponent<Props> = ({
    showDirectCompleteness,
}) => {
    const classes = useStyles();
    const theme = useTheme();
    const legendDirectLabels = useGetDirectLabels();
    return (
        <Paper elevation={1} className={classes.root}>
            <Box className={classes.legendContainer}>
                {showDirectCompleteness && (
                    <LegendThreshold scale={getDirectLegend}>
                        {labels =>
                            labels.reverse().map(label => {
                                return (
                                    <LegendItem
                                        key={`legend-direct-${label.value}`}
                                        margin={theme.spacing(0, 0, 1, 0)}
                                    >
                                        <svg width={20} height={20}>
                                            <circle
                                                fill={label.value}
                                                cx="10"
                                                cy="10"
                                                r="10"
                                            />
                                        </svg>
                                        <LegendLabel
                                            align="left"
                                            margin={theme.spacing(0, 0, 0, 1)}
                                        >
                                            {legendDirectLabels[label.index]}
                                        </LegendLabel>
                                    </LegendItem>
                                );
                            })
                        }
                    </LegendThreshold>
                )}

                {!showDirectCompleteness && (
                    <LegendThreshold scale={getLegend}>
                        {labels =>
                            labels.reverse().map(label => {
                                return (
                                    <LegendItem
                                        key={`legend-${label.value}`}
                                        margin={theme.spacing(0, 0, 1, 0)}
                                    >
                                        <svg width={20} height={20}>
                                            <circle
                                                fill={label.value}
                                                cx="10"
                                                cy="10"
                                                r="10"
                                            />
                                        </svg>
                                        <LegendLabel
                                            align="left"
                                            margin={theme.spacing(0, 0, 0, 1)}
                                        >
                                            {legendLabels[label.index]}
                                        </LegendLabel>
                                    </LegendItem>
                                );
                            })
                        }
                    </LegendThreshold>
                )}
            </Box>
        </Paper>
    );
};
