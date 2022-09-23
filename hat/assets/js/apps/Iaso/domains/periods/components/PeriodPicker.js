import React, { useState, useEffect } from 'react';
import { Grid, makeStyles, Box, Typography } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import { DatePicker, useSafeIntl, commonStyles } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';

import { getYears } from '../../../utils';
import { getPeriodPickerString } from '../utils';
import {
    hasFeatureFlag,
    HIDE_PERIOD_QUARTER_NAME,
} from '../../../utils/featureFlags';
import { Period } from '../models';

import {
    PERIOD_TYPE_DAY,
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_SIX_MONTH,
    PERIOD_TYPE_YEAR,
    MONTHS,
    QUARTERS,
    QUARTERS_RANGE,
    SEMESTERS,
    SEMESTERS_RANGE,
} from '../constants';
import MESSAGES from '../messages';
import { useCurrentUser } from '../../../utils/usersUtils.ts';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    title: {
        fontSize: 17,
        marginBottom: 3,
    },
}));

const PeriodPicker = ({
    periodType,
    title,
    onChange,
    activePeriodString,
    hasError,
    keyName,
}) => {
    const classes = useStyles();
    const theme = useTheme();
    const { formatMessage } = useSafeIntl();
    const [currentPeriod, setCurrentPeriod] = useState(
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

    const handleChange = (changedKeyName, value) => {
        let newPeriod = {
            ...currentPeriod,
            [changedKeyName]: value,
        };
        if (changedKeyName === 'year' && !value) {
            newPeriod = null;
        }
        setCurrentPeriod(newPeriod);
        onChange(getPeriodPickerString(periodType, newPeriod, value));
    };
    if (!periodType) {
        return null;
    }
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
    return (
        <Box
            id={keyName}
            mt={2}
            p={currentPeriodType === PERIOD_TYPE_DAY ? 0 : 1}
            mb={2}
            border={currentPeriodType === PERIOD_TYPE_DAY ? 0 : 1}
            borderRadius={5}
            borderColor={
                hasError ? theme.palette.error.main : 'rgba(0,0,0,0.23)'
            }
        >
            {currentPeriodType === PERIOD_TYPE_DAY && (
                <DatePicker
                    label={title}
                    clearMessage={MESSAGES.clear}
                    currentDate={currentPeriod?.day}
                    errors={hasError ? [''] : []}
                    hideError
                    onChange={date =>
                        handleChange(
                            'day',
                            date ? date.format('YYYYMMDD') : null,
                        )
                    }
                />
            )}
            {currentPeriodType !== PERIOD_TYPE_DAY && (
                <>
                    <Typography variant="h6" className={classes.title}>
                        {title}
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid
                            item
                            sm={currentPeriodType === PERIOD_TYPE_YEAR ? 12 : 6}
                        >
                            <InputComponent
                                keyValue="year"
                                onChange={handleChange}
                                clearable
                                value={currentPeriod && currentPeriod.year}
                                type="select"
                                options={getYears(15, 10, true).map(y => ({
                                    label: y.toString(),
                                    value: y.toString(),
                                }))}
                                label={MESSAGES.year}
                            />
                        </Grid>
                        {currentPeriodType !== PERIOD_TYPE_YEAR && (
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
        </Box>
    );
};

PeriodPicker.defaultProps = {
    activePeriodString: undefined,
    periodType: undefined,
    hasError: false,
};

PeriodPicker.propTypes = {
    periodType: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    title: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    activePeriodString: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
    hasError: PropTypes.bool,
    keyName: PropTypes.string.isRequired,
};

export default PeriodPicker;
