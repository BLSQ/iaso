import React, { useState, FunctionComponent, useCallback } from 'react';
import { makeStyles, Box, IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { LegendRange } from './LegendRange';
import { RangeValue, ScaleThreshold } from './types';
import { legendColors } from './colors';
import { useGetRangeValues, useGetScaleThreshold } from './hooks';

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        padding: theme.spacing(2),
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
    onChange;
};

export const LegendBuilder: FunctionComponent<LegendBuilderProps> = ({
    defaultScaleThreshold,
    onChange,
}) => {
    const classes = useStyles();
    const getScaleThreshold = useGetScaleThreshold();
    const getRangeValues = useGetRangeValues();
    const [rangeValues, setRangeValues] = useState<RangeValue[]>(
        getRangeValues(defaultScaleThreshold),
    );

    const handleNumberChange = useCallback(
        (index: number, newNumber?: number) => {
            if (newNumber || newNumber === 0) {
                const newRangeValues = [...rangeValues];
                newRangeValues[index].percent = Number(newNumber);
                setRangeValues(newRangeValues);
                onChange(getScaleThreshold(newRangeValues));
            }
        },
        [getScaleThreshold, onChange, rangeValues],
    );

    const handleColorChange = useCallback(
        (index: number) => (newColor: string) => {
            const newRangeValues = [...rangeValues];
            newRangeValues[index].color = newColor;
            setRangeValues(newRangeValues);
            onChange(getScaleThreshold(newRangeValues));
        },
        [getScaleThreshold, onChange, rangeValues],
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
        onChange(getScaleThreshold(newRanges));
    }, [getScaleThreshold, onChange, rangeValues]);

    const removeRangeValue = useCallback(
        (index: number) => {
            const newRangeValues = [...rangeValues];
            newRangeValues.splice(index, 1);
            setRangeValues(newRangeValues);
            onChange(getScaleThreshold(newRangeValues));
        },
        [getScaleThreshold, onChange, rangeValues],
    );

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
                    mr={1}
                    mt={-1}
                >
                    <IconButton size="small" onClick={addRangeValue}>
                        <AddIcon />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
};
