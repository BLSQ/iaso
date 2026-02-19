import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import { Box, FormHelperText, FormLabel, Grid } from '@mui/material';

import Typography from '@mui/material/Typography';
import { DatePicker } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import InputComponent from '../../../components/forms/InputComponent';

import {
    NO_PERIOD,
    PERIOD_TYPE_DAY,
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_PLACEHOLDER,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_QUARTER_NOV,
    PERIOD_TYPE_SIX_MONTH,
    PERIOD_TYPE_YEAR,
    PERIOD_TYPE_FINANCIAL_NOV,
    PERIOD_TYPE_WEEK,
} from '../constants';
import MESSAGES from '../messages';
import { Period, PeriodObject } from '../models';
import { usePeriodPickerOptions } from '../options';
import { getPeriodPickerString } from '../utils';

const styles: SxStyles = {
    title: {
        color: 'rgba(0, 0, 0, 0.4)', // taken from inputlabel
        fontSize: 17,
    },
    legend: {
        color: 'rgba(0, 0, 0, 0.4)', // taken from inputlabel
        paddingTop: 10,
        paddingLeft: 3,
        paddingRight: 3,
        fontSize: 13,
    },
    inputBorder: {
        borderRadius: 2,
        // @ts-ignore
        borderColor: theme => theme.palette.border.main,
        '&:hover': {
            // @ts-ignore
            borderColor: theme => theme.palette.border.hover,
        },
    },
    borderError: {
        borderRadius: 2,
        borderColor: theme => theme.palette.error.main,
    },
};

type Props = {
    periodType: string | Record<string, string>;
    title: string;
    onChange: (_) => any;
    activePeriodString?: string;
    hasError?: boolean;
    errors?: string[];
    keyName?: string;
    message?: string;
};

const PeriodPicker: FunctionComponent<Props> = ({
    periodType,
    title,
    onChange,
    activePeriodString,
    hasError = false,
    keyName = 'period',
    errors,
    message,
}) => {
    const [currentPeriod, setCurrentPeriod] =
        useState<Partial<PeriodObject> | null>(null);

    useEffect(() => {
        if (activePeriodString && Period.getPeriodType(activePeriodString)) {
            setCurrentPeriod(Period.parse(activePeriodString)[1]);
        } else {
            setCurrentPeriod(null);
        }
    }, [activePeriodString]);

    const handleChange = (
        changedKeyName: 'month' | 'year' | 'quarter' | 'semester',
        value: number,
    ) => {
        // FIXME: Figure out appropriate typescript
        let newPeriod: null | Partial<PeriodObject> = {
            ...currentPeriod,
            [changedKeyName]: value,
        };
        if (changedKeyName === 'year' && !value) {
            newPeriod = null;
        }
        setCurrentPeriod(newPeriod);
        onChange(getPeriodPickerString(periodType, newPeriod, value));
    };

    const handleChangeDay = useCallback(
        date => {
            const newValue = date?.format('YYYYMMDD') ?? null;
            try {
                const parsedValue = Period.parse(newValue)?.[1];
                setCurrentPeriod(parsedValue);
                onChange(newValue);
            } catch {
                setCurrentPeriod(newValue);
                onChange(newValue);
            }
        },
        [onChange],
    );

    const {
        semesterOptions,
        quarterOptions,
        monthOptions,
        yearOptions,
        weekOptions,
    } = usePeriodPickerOptions(periodType, currentPeriod);
    if (!periodType) {
        return null;
    }
    const displayError = hasError || (errors?.length ?? 0) > 0;

    return (
        <Box
            id={keyName}
            mt={2}
            p={periodType === PERIOD_TYPE_DAY ? 0 : 1}
            mb={2}
            border={periodType === PERIOD_TYPE_DAY ? 0 : 1}
            sx={displayError ? styles.borderError : styles.inputBorder}
        >
            {periodType === PERIOD_TYPE_DAY && (
                <DatePicker
                    label={title}
                    clearMessage={MESSAGES.clear}
                    currentDate={Period.toDate(currentPeriod)}
                    errors={hasError ? [''] : []}
                    hideError
                    onChange={handleChangeDay}
                />
            )}

            {periodType !== PERIOD_TYPE_DAY && (
                <>
                    {/* @ts-ignore */}
                    <FormLabel component="legend" sx={styles.title}>
                        {title}
                    </FormLabel>

                    <Grid container spacing={2}>
                        {![PERIOD_TYPE_PLACEHOLDER, NO_PERIOD].includes(
                            periodType as string,
                        ) && (
                            <Grid
                                item
                                sm={
                                    periodType === PERIOD_TYPE_YEAR ||
                                    periodType === PERIOD_TYPE_FINANCIAL_NOV
                                        ? 12
                                        : 4
                                }
                            >
                                <InputComponent
                                    keyValue="year"
                                    onChange={handleChange}
                                    clearable
                                    value={currentPeriod && currentPeriod.year}
                                    type="select"
                                    options={yearOptions}
                                    label={MESSAGES.year}
                                />
                            </Grid>
                        )}
                        {[PERIOD_TYPE_PLACEHOLDER, NO_PERIOD].includes(
                            periodType as string,
                        ) && (
                            <Grid item>
                                <Typography sx={styles.legend}>
                                    {message}
                                </Typography>
                            </Grid>
                        )}

                        {(periodType === PERIOD_TYPE_MONTH ||
                            periodType === PERIOD_TYPE_QUARTER ||
                            periodType === PERIOD_TYPE_QUARTER_NOV ||
                            periodType === PERIOD_TYPE_SIX_MONTH ||
                            periodType === PERIOD_TYPE_WEEK) && (
                            <Grid item sm={8}>
                                {periodType === PERIOD_TYPE_MONTH && (
                                    <InputComponent
                                        keyValue="month"
                                        disabled={
                                            !currentPeriod ||
                                            (currentPeriod &&
                                                !currentPeriod.year)
                                        }
                                        onChange={handleChange}
                                        clearable
                                        value={
                                            currentPeriod && currentPeriod.month
                                        }
                                        type="select"
                                        options={monthOptions}
                                        label={MESSAGES.month}
                                    />
                                )}
                                {(periodType === PERIOD_TYPE_QUARTER ||
                                    periodType === PERIOD_TYPE_QUARTER_NOV) && (
                                    <InputComponent
                                        keyValue="quarter"
                                        onChange={handleChange}
                                        disabled={
                                            !currentPeriod ||
                                            (currentPeriod &&
                                                !currentPeriod.year)
                                        }
                                        clearable
                                        value={
                                            currentPeriod &&
                                            currentPeriod.quarter
                                        }
                                        type="select"
                                        options={quarterOptions}
                                        label={MESSAGES.quarter}
                                    />
                                )}

                                {periodType === PERIOD_TYPE_SIX_MONTH && (
                                    <InputComponent
                                        keyValue="semester"
                                        onChange={handleChange}
                                        clearable
                                        disabled={
                                            !currentPeriod ||
                                            (currentPeriod &&
                                                !currentPeriod.year)
                                        }
                                        value={
                                            currentPeriod &&
                                            currentPeriod.semester
                                        }
                                        type="select"
                                        options={semesterOptions}
                                        label={MESSAGES.six_month}
                                    />
                                )}
                                {periodType == PERIOD_TYPE_WEEK && (
                                    <InputComponent
                                        keyValue="week"
                                        onChange={handleChange}
                                        disabled={!currentPeriod?.year}
                                        clearable
                                        value={currentPeriod?.week}
                                        type="select"
                                        options={weekOptions}
                                        label={MESSAGES.week}
                                    />
                                )}
                            </Grid>
                        )}
                    </Grid>
                </>
            )}
            <FormHelperText error={displayError}>{errors}</FormHelperText>
        </Box>
    );
};

export default PeriodPicker;
