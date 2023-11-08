import React, { FunctionComponent, useMemo } from 'react';
import { Paper, makeStyles, Box, useTheme } from '@material-ui/core';
import { scaleThreshold } from '@visx/scale';
import { LegendThreshold, LegendItem, LegendLabel } from '@visx/legend';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { ScaleThreshold } from '../../../components/LegendBuilder/types';
import { useGetThresHoldLabels } from '../../../components/LegendBuilder/hooks';

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

const defaultScaleThreshold = {
    domain: [70, 90],
    range: ['red', 'orange', 'green'],
};

export const getDirectLegend = scaleThreshold({
    domain: [100],
    range: ['red', 'green'],
});

export const useGetLegend = (threshold?: ScaleThreshold): any => {
    return scaleThreshold(threshold);
};

const useGetDirectLabels = (): string[] => {
    const { formatMessage } = useSafeIntl();
    return [
        formatMessage(MESSAGES.notCompleted),
        formatMessage(MESSAGES.completed),
    ];
};

type Props = {
    showDirectCompleteness: boolean;
    threshold?: ScaleThreshold;
};

export const MapLegend: FunctionComponent<Props> = ({
    showDirectCompleteness,
    threshold = defaultScaleThreshold,
}) => {
    const classes = useStyles();
    const theme = useTheme();
    const legendDirectLabels = useGetDirectLabels();
    const getLegendCustom = useGetLegend(threshold);
    const getThresHoldLabels = useGetThresHoldLabels();
    const legendLabels = useMemo(
        () => getThresHoldLabels(threshold),
        [getThresHoldLabels, threshold],
    );
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
                    <LegendThreshold scale={getLegendCustom}>
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
