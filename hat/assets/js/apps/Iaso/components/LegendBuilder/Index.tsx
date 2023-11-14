import React, { FunctionComponent, useCallback } from 'react';
import { makeStyles, Box, IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';

import { LegendRange } from './LegendRange';
import { RangeValue } from './types';
import { legendColors } from './colors';

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
        '& .MuiFormControl-root .error-container': {
            paddingLeft: 0,
            paddingTop: 4,
        },
        '& .MuiFormControl-root .error-container p': {
            fontSize: 11,
        },
    },
    legendContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
}));

type LegendBuilderProps = {
    rangeValues: RangeValue[];
    // eslint-disable-next-line no-unused-vars
    onChange: (newRangeValues: RangeValue[]) => void;
    // eslint-disable-next-line no-unused-vars
    setFieldError: (keyValue: string, message: string) => void;
    errors?: string[];
};

export const LegendBuilder: FunctionComponent<LegendBuilderProps> = ({
    rangeValues,
    onChange,
    setFieldError,
    errors = [],
}) => {
    const classes = useStyles();
    const handleNumberChange = useCallback(
        (index: number, newNumber?: number) => {
            if (newNumber || newNumber === 0) {
                const newRangeValues = [...rangeValues];
                newRangeValues[index].percent = Number(newNumber);
                onChange(newRangeValues);
            }
        },
        [onChange, rangeValues],
    );

    const handleColorChange = useCallback(
        (index: number) => (newColor: string) => {
            const newRangeValues = [...rangeValues];
            newRangeValues[index].color = newColor;
            onChange(newRangeValues);
        },
        [onChange, rangeValues],
    );

    const addRangeValue = useCallback(() => {
        const newRangeValues = [...rangeValues];
        const lastRange = newRangeValues[newRangeValues.length - 1];
        const lastPercent = lastRange.percent - 1;
        newRangeValues.push({
            id: `range-${rangeValues.length + 1}`,
            percent: lastPercent,
            color: legendColors[0],
        });
        onChange(newRangeValues);
    }, [onChange, rangeValues]);

    const removeRangeValue = useCallback(
        (index: number) => {
            const newRangeValues = [...rangeValues];
            newRangeValues.splice(index, 1);
            onChange(newRangeValues);
        },
        [onChange, rangeValues],
    );

    const getErrors = useCallback(
        index => {
            return index < errors.length && errors[index]
                ? [errors[index]]
                : [];
        },
        [errors],
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
                        setFieldError={setFieldError}
                        errors={getErrors(index)}
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
