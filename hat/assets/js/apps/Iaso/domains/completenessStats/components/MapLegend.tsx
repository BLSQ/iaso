import React, { FunctionComponent } from 'react';
import { Box, Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { scaleThreshold } from '@visx/scale';
import { Legend } from 'Iaso/components/LegendBuilder/Legend';
import { ScaleThreshold } from 'Iaso/components/LegendBuilder/types';

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

export const getDirectLegend = scaleThreshold({
    domain: [100],
    range: ['red', 'green'],
});

type Props = {
    showDirectCompleteness: boolean;
    threshold: ScaleThreshold;
};

export const MapLegend: FunctionComponent<Props> = ({
    showDirectCompleteness,
    threshold,
}) => {
    const classes = useStyles();
    return (
        <Paper elevation={1} className={classes.root}>
            <Box className={classes.legendContainer}>
                {showDirectCompleteness && (
                    <Legend
                        threshold={{
                            domain: [100],
                            range: ['red', 'green'],
                        }}
                    />
                )}

                {!showDirectCompleteness && <Legend threshold={threshold} />}
            </Box>
        </Paper>
    );
};
