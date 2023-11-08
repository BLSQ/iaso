import React, { useState, FunctionComponent, useCallback } from 'react';
import { makeStyles, Box, Button, IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { useSafeIntl } from 'bluesquare-components';
import { LegendRange } from './LegendRange';
import { RangeValue, ScaleThreshold } from './types';
import { legendColors } from './colors';
import { useGetRangeValues, useGetScaleThreshold } from './hooks';
import { MESSAGES } from './messages';
import { MapLegend } from '../../domains/completenessStats/components/MapLegend';

const useStyles = makeStyles(theme => ({
    root: {
        width: 330,
        padding: theme.spacing(2),
        // @ts-ignore
        border: `1px solid ${theme.palette.border.main}`,
        borderRadius: 4,
        '& .MuiFormControl-root label': {
            display: 'none !important',
        },
        '& .MuiFormControl-root .MuiOutlinedInput-input': {
            height: 13,
            padding: 10,
        },
    },
    legendContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
}));

type LegendBuilderProps = {
    defaultScaleThreshold?: ScaleThreshold;
};

export const LegendBuilder: FunctionComponent<LegendBuilderProps> = ({
    defaultScaleThreshold = {
        domain: [70, 90],
        range: [legendColors[8], legendColors[5], legendColors[2]],
    },
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const getScaleThreshold = useGetScaleThreshold();
    const getRangeValues = useGetRangeValues();
    const [rangeValues, setRangeValues] = useState<RangeValue[]>(
        getRangeValues(defaultScaleThreshold),
    );
    const [scaleThreshold, setScaleThreshold] = useState<ScaleThreshold>(
        defaultScaleThreshold,
    );

    const handleNumberChange = useCallback(
        (index: number, newNumber?: number) => {
            if (newNumber || newNumber === 0) {
                const newRangeValues = [...rangeValues];
                newRangeValues[index].percent = Number(newNumber);
                setRangeValues(newRangeValues);
            }
        },
        [rangeValues],
    );

    const handleColorChange = useCallback(
        (index: number) => (newColor: string) => {
            const newRangeValues = [...rangeValues];
            newRangeValues[index].color = newColor;
            setRangeValues(newRangeValues);
        },
        [rangeValues],
    );

    const addRangeValue = useCallback(() => {
        const newRanges = [...rangeValues];
        const lastRange = newRanges[newRanges.length - 1];
        const lastPercent = lastRange.percent - 1;
        newRanges.push({
            id: `range-${rangeValues.length + 1}`,
            percent: lastPercent,
            color: legendColors[0],
        });
        setRangeValues(newRanges);
    }, [rangeValues]);

    const removeRangeValue = useCallback(
        (index: number) => {
            const newRangeValues = [...rangeValues];
            newRangeValues.splice(index, 1);
            setRangeValues(newRangeValues);
        },
        [rangeValues],
    );
    const handleSave = useCallback(() => {
        setScaleThreshold(getScaleThreshold(rangeValues));
    }, [getScaleThreshold, rangeValues]);

    return (
        <Box className={classes.root}>
            <Box className={classes.legendContainer}>
                {rangeValues.map((rangeItem, index) => (
                    <LegendRange
                        key={rangeItem.id}
                        rangeItem={rangeItem}
                        index={index}
                        rangeValues={rangeValues}
                        handleColorChange={handleColorChange}
                        handleNumberChange={handleNumberChange}
                        removeRangeValue={removeRangeValue}
                    />
                ))}
                <Box
                    display="flex"
                    justifyContent="flex-end"
                    width="100%"
                    mb={2}
                    mr={1}
                    mt={-1}
                >
                    <IconButton size="small" onClick={addRangeValue}>
                        <AddIcon />
                    </IconButton>
                </Box>
                <MapLegend
                    showDirectCompleteness={false}
                    threshold={scaleThreshold}
                />
                <Box display="flex" justifyContent="flex-end" width="100%">
                    <Box mr={1}>
                        <Button
                            size="small"
                            variant="contained"
                            color="primary"
                        >
                            {formatMessage(MESSAGES.cancel)}
                        </Button>
                    </Box>
                    <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                    >
                        {formatMessage(MESSAGES.save)}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};
