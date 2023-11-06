import React, {
    useState,
    FunctionComponent,
    useCallback,
    useEffect,
} from 'react';
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

type Operator = '<' | '<=';

type RangeValue = {
    id: string;
    operator: Operator;
    percent: number;
    color: string;
};

type LegendDialogProps = {
    defaultRangeValues?: RangeValue[];
};

const LegendDialog: FunctionComponent<LegendDialogProps> = ({
    defaultRangeValues = [
        {
            id: 'range-1',
            operator: '<=',
            percent: 100,
            color: '#000000',
        },
    ],
}) => {
    const classes = useStyles();
    const [rangeValues, setRangeValues] =
        useState<RangeValue[]>(defaultRangeValues);
    const getRangeStartEnd = useCallback(
        (range, index) => {
            let start = 0;
            let end = 0;
            const nextRange =
                index === rangeValues.length - 1
                    ? undefined
                    : rangeValues[index + 1];
            if (range.operator === '<' || range.operator === '<=') {
                start = nextRange?.percent || 0;
                end = range.percent;
                if (nextRange?.operator === '<=') {
                    start = nextRange.percent + 1;
                }
                if (range.operator === '<') {
                    end -= 1;
                }
            }
            return {
                start,
                end,
            };
        },
        [rangeValues],
    );

    const handleOperatorChange = useCallback(
        (index: number, newOperator?: Operator) => {
            if (newOperator) {
                const newRangeValues = [...rangeValues];
                newRangeValues[index].operator = newOperator;
                setRangeValues(newRangeValues);
            }
        },
        [rangeValues],
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
            operator: '<=',
            percent: lastPercent,
            color: '#000000',
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

    return (
        <Paper elevation={1} className={classes.root}>
            <Box className={classes.legendContainer}>
                {rangeValues.map((rangeItem, index) => {
                    const { start, end } = getRangeStartEnd(rangeItem, index);
                    const previousRange =
                        index !== 0 ? rangeValues[index - 1] : undefined;
                    let max = 100;
                    if (previousRange) {
                        max =
                            previousRange.operator === '<'
                                ? previousRange.percent - 1
                                : previousRange.percent;
                    }
                    //  get max here from previous range
                    return (
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
                                        disabled={index === 0}
                                        value={rangeItem.operator}
                                        onChange={(_, newValue) =>
                                            handleOperatorChange(
                                                index,
                                                newValue,
                                            )
                                        }
                                        options={[
                                            {
                                                label: '<',
                                                value: '<',
                                            },
                                            {
                                                label: '<=',
                                                value: '<=',
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
                                        disabled={index === 0}
                                        withMarginTop={false}
                                        value={rangeItem.percent}
                                        onChange={(_, newValue) =>
                                            handleNumberChange(index, newValue)
                                        }
                                        type="number"
                                        min={0}
                                        max={max}
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
                                    {/* {`start: ${start}`}
                                    {` end: ${end}`} */}
                                    {index !== 0 && (
                                        <IconButton
                                            onClick={() =>
                                                removeRangeValue(index)
                                            }
                                        >
                                            <RemoveIcon />
                                        </IconButton>
                                    )}
                                </Grid>
                            </Grid>
                        </Box>
                    );
                })}
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
