import React, { FunctionComponent } from 'react';
import {
    makeStyles,
    IconButton,
    Grid,
    Typography,
    Box,
} from '@material-ui/core';
import RemoveIcon from '@material-ui/icons/Remove';
import { ColorPicker } from '../forms/ColorPicker';
import InputComponent from '../forms/InputComponent';
import { RangeValue } from './types';
import { legendColors } from './colors';

const useStyles = makeStyles(theme => ({
    legendItem: {
        marginBottom: theme.spacing(2),
        // @ts-ignore
        border: `1px solid ${theme.palette.border.main}`,
        borderRadius: 4,
    },
    input: {
        margin: theme.spacing(1),
    },
}));

type LegendRowProps = {
    rangeItem: RangeValue;
    index: number;
    rangeValues: RangeValue[];
    // eslint-disable-next-line no-unused-vars
    handleColorChange: (index: number) => void;
    // eslint-disable-next-line no-unused-vars
    handleNumberChange: (index: number, newNumber?: number) => void;
    // eslint-disable-next-line no-unused-vars
    removeRangeValue: (index: number) => void;
    // eslint-disable-next-line no-unused-vars
    setFieldError: (keyValue: string, message: string) => void;
    errors?: string[];
};

export const LegendRange: FunctionComponent<LegendRowProps> = ({
    rangeItem,
    index,
    rangeValues,
    handleColorChange,
    handleNumberChange,
    removeRangeValue,
    setFieldError,
    errors = [],
}) => {
    const classes = useStyles();
    const previousRange = index !== 0 ? rangeValues[index - 1] : undefined;
    const nextRange =
        index !== rangeValues.length - 1 ? rangeValues[index + 1] : undefined;
    let max = 100;
    let min = 0;
    if (previousRange) {
        max = previousRange.percent - 1;
    }
    if (nextRange) {
        min = nextRange.percent;
    }
    return (
        <Grid container spacing={2} className={classes.legendItem}>
            <Grid
                item
                xs={12}
                sm={2}
                container
                alignContent="center"
                justifyContent="flex-end"
            >
                <Box pt="2px">
                    <ColorPicker
                        currentColor={rangeItem.color}
                        // @ts-ignore
                        onChangeColor={handleColorChange(index)}
                        displayLabel={false}
                        colors={legendColors}
                    />
                </Box>
            </Grid>
            <Grid
                item
                xs={12}
                sm={3}
                container
                alignContent="center"
                justifyContent="center"
            >
                <Typography variant="h6">{` < `}</Typography>
            </Grid>
            <Grid item xs={12} sm={5}>
                <InputComponent
                    keyValue={`percent-${rangeItem.id}`}
                    className={classes.input}
                    labelString=""
                    disabled={index === 0}
                    withMarginTop={false}
                    value={rangeItem.percent}
                    onChange={(_, newValue) =>
                        handleNumberChange(index, newValue)
                    }
                    type="number"
                    min={min}
                    max={max}
                    required
                    numberInputOptions={{
                        decimalScale: 0,
                    }}
                    setFieldError={setFieldError}
                    errors={errors}
                />
            </Grid>
            <Grid
                item
                xs={12}
                sm={2}
                container
                alignContent="center"
                justifyContent="flex-end"
            >
                {index !== 0 && (
                    <IconButton
                        size="small"
                        onClick={() => removeRangeValue(index)}
                    >
                        <RemoveIcon />
                    </IconButton>
                )}
            </Grid>
        </Grid>
    );
};
