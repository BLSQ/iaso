import React, { useState, FunctionComponent, useCallback } from 'react';
import {
    Paper,
    makeStyles,
    Box,
    Button,
    IconButton,
    Grid,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import { ColorPicker } from '../../../components/forms/ColorPicker';
import InputComponent from '../../../components/forms/InputComponent';

const useStyles = makeStyles(theme => ({
    root: {
        padding: theme.spacing(1),
        marginBottom: theme.spacing(1),
        '& .MuiFormControl-root label': {
            display: 'none !important',
        },
    },
    legendContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    input: {
        margin: theme.spacing(1),
    },
}));

type Operator = '<' | '>' | '<=' | '>=';

type RangeValue = {
    id: number;
    operator: Operator;
    percent: number;
    color: string;
};

type LegendDialogProps = {
    defaultRangeValues?: RangeValue[];
};

const LegendDialog: FunctionComponent<LegendDialogProps> = ({
    defaultRangeValues = [
        { id: 0, operator: '<', percent: 0, color: '#000000' },
    ],
}) => {
    const classes = useStyles();
    const [idCounter, setIdCounter] = useState<number>(0);
    const [rangeValues, setRangeValues] =
        useState<RangeValue[]>(defaultRangeValues);

    const handleOperatorChange = useCallback(
        (index: number, newOperator?: Operator) => {
            if (newOperator) {
                console.log('newOperator', newOperator);
                const newRangeValues = [...rangeValues];
                newRangeValues[index].operator = newOperator;
                setRangeValues(newRangeValues);
            }
        },
        [rangeValues],
    );

    const handleNumberChange = useCallback(
        (index: number, newNumber?: number) => {
            if (newNumber) {
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
        setIdCounter(idCounter + 1);
        setRangeValues([
            ...rangeValues,
            { id: idCounter + 1, operator: '<', percent: 0, color: '#000000' },
        ]);
    }, [idCounter, rangeValues]);

    const removeRangeValue = useCallback(
        (index: number) => {
            const newRangeValues = [...rangeValues];
            newRangeValues.splice(index, 1);
            setRangeValues(newRangeValues);
        },
        [rangeValues],
    );

    return (
        <Paper elevation={1} className={classes.root}>
            <Box className={classes.legendContainer}>
                {rangeValues.map((rangeItem, index) => (
                    <Box key={rangeItem.id} mt={2}>
                        <Grid container spacing={2}>
                            <Grid
                                item
                                xs={12}
                                sm={2}
                                container
                                alignContent="center"
                                justifyContent="center"
                            >
                                <ColorPicker
                                    currentColor={rangeItem.color}
                                    onChangeColor={handleColorChange(index)}
                                    displayLabel={false}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <InputComponent
                                    clearable={false}
                                    withMarginTop={false}
                                    keyValue={`operator-${rangeItem.id}`}
                                    className={classes.input}
                                    labelString=""
                                    value={rangeItem.operator}
                                    onChange={(_, newValue) =>
                                        handleOperatorChange(index, newValue)
                                    }
                                    options={[
                                        {
                                            label: '<',
                                            value: '<',
                                        },
                                        {
                                            label: '>',
                                            value: '>',
                                        },
                                    ]}
                                    type="select"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <InputComponent
                                    keyValue={`percent-${rangeItem.id}`}
                                    className={classes.input}
                                    labelString=""
                                    withMarginTop={false}
                                    value={rangeItem.percent}
                                    onChange={(_, newValue) =>
                                        handleNumberChange(index, newValue)
                                    }
                                    type="number"
                                    min={0}
                                    max={100}
                                    decimalScale={0}
                                />
                            </Grid>
                            <Grid
                                item
                                xs={12}
                                sm={2}
                                container
                                alignContent="center"
                            >
                                <IconButton
                                    onClick={() => removeRangeValue(index)}
                                >
                                    <RemoveIcon />
                                </IconButton>
                            </Grid>
                        </Grid>
                    </Box>
                ))}
                <Box display="flex" justifyContent="flex-end" width="100%">
                    <IconButton onClick={addRangeValue}>
                        <AddIcon />
                    </IconButton>
                </Box>
                <Button variant="contained" color="primary">
                    Create Legend
                </Button>
            </Box>
        </Paper>
    );
};

export default LegendDialog;
