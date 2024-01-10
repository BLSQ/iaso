import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import { Box, FormHelperText, FormLabel, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';

// @ts-ignore
import { commonStyles, DatePicker, useSafeIntl } from 'bluesquare-components';
import Typography from '@mui/material/Typography';
import InputComponent from '../../../components/forms/InputComponent';

import { getYears } from '../../../utils';
import { getPeriodPickerString } from '../utils';
import {
    hasFeatureFlag,
    HIDE_PERIOD_QUARTER_NAME,
} from '../../../utils/featureFlags';
import { Period, PeriodObject } from '../models';

import {
    MONTHS,
    PERIOD_TYPE_DAY,
    PERIOD_TYPE_PLACEHOLDER,
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_SIX_MONTH,
    PERIOD_TYPE_YEAR,
    QUARTERS,
    QUARTERS_RANGE,
    SEMESTERS,
    SEMESTERS_RANGE,
} from '../constants';
import MESSAGES from '../messages';
import { useCurrentUser } from '../../../utils/usersUtils';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    title: {
        color: 'rgba(0, 0, 0, 0.4)', // taken from inputlabel
        paddingLeft: 3,
        paddingRight: 3,
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
        borderRadius: 5,
        // @ts-ignore
        borderColor: theme.palette.border.main,
        '&:hover': {
            // @ts-ignore
            borderColor: theme.palette.border.hover,
        },
    },
    borderError: {
        borderRadius: 5,
        borderColor: theme.palette.error.main,
    },
}));

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
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const [currentPeriod, setCurrentPeriod] =
        useState<Partial<PeriodObject> | null>(
            activePeriodString && Period.getPeriodType(activePeriodString)
                ? Period.parse(activePeriodString)[1]
                : null,
        );
    const [currentPeriodType, setCurrentPeriodType] = useState(periodType);
    const currentUser = useCurrentUser();

    useEffect(() => {
        if (currentPeriodType !== periodType) {
            setCurrentPeriod(null);
        }
        setCurrentPeriodType(periodType);
    }, [periodType, currentPeriodType]);

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
            } catch (e) {
                setCurrentPeriod(newValue);
                onChange(newValue);
            }
        },
        [onChange],
    );

    const getQuarterOptionLabel = (value, label) => {
        if (hasFeatureFlag(currentUser, HIDE_PERIOD_QUARTER_NAME)) {
            return `${formatMessage(QUARTERS_RANGE[value][0])}-${formatMessage(
                QUARTERS_RANGE[value][1],
            )}`;
        }
        return `${label} (${formatMessage(
            QUARTERS_RANGE[value][0],
        )}-${formatMessage(QUARTERS_RANGE[value][1])})`;
    };

    if (!periodType) {
        return null;
    }
    const displayError = hasError || (errors?.length ?? 0) > 0;

    return (
        <Box
            id={keyName}
            mt={2}
            p={currentPeriodType === PERIOD_TYPE_DAY ? 0 : 1}
            mb={2}
            border={currentPeriodType === PERIOD_TYPE_DAY ? 0 : 1}
            className={
                /* @ts-ignore */
                displayError ? classes.inputBorderError : classes.inputBorder
            }
        >
            {currentPeriodType === PERIOD_TYPE_DAY && (
                <DatePicker
                    label={title}
                    clearMessage={MESSAGES.clear}
                    currentDate={Period.toDate(currentPeriod)}
                    errors={hasError ? [''] : []}
                    hideError
                    onChange={handleChangeDay}
                />
            )}

            {currentPeriodType !== PERIOD_TYPE_DAY && (
                <>
                    {/* @ts-ignore */}
                    <FormLabel component="legend" className={classes.title}>
                        {title}
                    </FormLabel>

                    <Grid container spacing={2}>
                        {currentPeriodType !== PERIOD_TYPE_PLACEHOLDER && (
                            <Grid
                                item
                                sm={
                                    currentPeriodType === PERIOD_TYPE_YEAR
                                        ? 12
                                        : 6
                                }
                            >
                                <InputComponent
                                    keyValue="year"
                                    onChange={handleChange}
                                    clearable
                                    value={currentPeriod && currentPeriod.year}
                                    type="select"
                                    options={getYears(20, 10, true).map(y => ({
                                        label: y.toString(),
                                        value: y.toString(),
                                    }))}
                                    label={MESSAGES.year}
                                />
                            </Grid>
                        )}
                        {currentPeriodType === PERIOD_TYPE_PLACEHOLDER && (
                            <Grid item>
                                <Typography className={classes.legend}>
                                    {message}
                                </Typography>
                            </Grid>
                        )}

                        {(currentPeriodType === PERIOD_TYPE_MONTH ||
                            currentPeriodType === PERIOD_TYPE_QUARTER ||
                            currentPeriodType === PERIOD_TYPE_SIX_MONTH) && (
                            <Grid item sm={6}>
                                {currentPeriodType === PERIOD_TYPE_MONTH && (
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
                                        options={Object.entries(MONTHS).map(
                                            ([value, month]) => ({
                                                label: formatMessage(month),
                                                value,
                                            }),
                                        )}
                                        label={MESSAGES.month}
                                    />
                                )}
                                {currentPeriodType === PERIOD_TYPE_QUARTER && (
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
                                        options={Object.entries(QUARTERS).map(
                                            ([value, label]) => ({
                                                label: getQuarterOptionLabel(
                                                    value,
                                                    label,
                                                ),
                                                value,
                                            }),
                                        )}
                                        label={MESSAGES.quarter}
                                    />
                                )}

                                {currentPeriodType ===
                                    PERIOD_TYPE_SIX_MONTH && (
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
                                        options={Object.entries(SEMESTERS).map(
                                            ([value, label]) => ({
                                                label: `${label} (${formatMessage(
                                                    SEMESTERS_RANGE[value][0],
                                                )}-${formatMessage(
                                                    SEMESTERS_RANGE[value][1],
                                                )})`,
                                                value,
                                            }),
                                        )}
                                        label={MESSAGES.six_month}
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
