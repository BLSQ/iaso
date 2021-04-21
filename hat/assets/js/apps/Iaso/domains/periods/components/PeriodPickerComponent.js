import React, { useState } from 'react';

import { makeStyles, Grid, Box, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';

import InputComponent from '../../../components/forms/InputComponent';

import { getYears } from '../../../utils';
import commonStyles from '../../../styles/common';
import { Period } from '../models';
import { useSafeIntl } from '../../../hooks/intl';
import {
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_SIX_MONTH,
    PERIOD_TYPE_YEAR,
} from '../constants';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    title: {
        fontSize: 18,
        marginBottom: theme.spacing(1),
        color: 'rgba(0, 0, 0, 0.7)',
    },
}));

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
const semesters = ['S1', 'S2'];

const getDefaultPeriod = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = Period.padMonth(new Date().getMonth() + 1);
    return new Period(`${currentYear}${currentMonth}`);
};

const getIntegerArray = size =>
    Array(size)
        .fill()
        .map((y, i) => size - i)
        .reverse();

const PeriodPicker = ({ periodType, title }) => {
    const classes = useStyles();
    const intl = useSafeIntl();
    const [currentPeriod, setCurrentPeriod] = useState(getDefaultPeriod());

    const handleChange = (keyName, value) => {
        let periodString;
        if (keyName === 'year') {
            periodString = `${value}${Period.padMonth(currentPeriod.month)}`;
        }
        if (keyName === 'month') {
            periodString = `${currentPeriod.year}${Period.padMonth(value)}`;
        }
        if (keyName === 'quarter') {
            periodString = `${currentPeriod.year}${quarters[value - 1]}`;
        }
        if (keyName === 'semester') {
            periodString = `${currentPeriod.year}${semesters[value - 1]}`;
        }
        if (periodString) {
            setCurrentPeriod(new Period(periodString));
        }
    };
    const { periodString } = currentPeriod.asPeriodType(periodType);
    console.log('currentPeriod', currentPeriod.asPeriodType(periodType));
    return (
        <Box
            mt={2}
            pt={1}
            pb={2}
            pl={2}
            pr={2}
            mb={2}
            border={1}
            borderRadius={5}
            borderColor="rgba(0, 0, 0, 0.23)"
        >
            {intl.formatMessage(MESSAGES.july)}
            {/* {periodString}
            {periodType} */}
            <Typography variant="h6" className={classes.title}>
                {title}
            </Typography>
            <Grid container spacing={2}>
                <Grid item sm={periodType === PERIOD_TYPE_YEAR ? 12 : 6}>
                    <InputComponent
                        keyValue="year"
                        onChange={handleChange}
                        clearable={false}
                        value={currentPeriod.year}
                        type="select"
                        options={getYears(20, 10).map(y => ({
                            label: y,
                            value: y,
                        }))}
                        label={MESSAGES.year}
                    />
                </Grid>
                {periodType !== PERIOD_TYPE_YEAR && (
                    <Grid item sm={6}>
                        {periodType === PERIOD_TYPE_MONTH && (
                            <InputComponent
                                keyValue="month"
                                onChange={handleChange}
                                required
                                clearable={false}
                                value={currentPeriod.month}
                                type="select"
                                options={getIntegerArray(12).map(month => ({
                                    label: intl.formatMessage(
                                        MESSAGES.find(
                                            mess => mess.order === month,
                                        ),
                                    ),
                                    value: month,
                                }))}
                                label={MESSAGES.month}
                            />
                        )}
                        {periodType === PERIOD_TYPE_QUARTER && (
                            <InputComponent
                                keyValue="quarter"
                                onChange={handleChange}
                                clearable={false}
                                value={currentPeriod.quarter}
                                type="select"
                                options={getIntegerArray(4).map(q => ({
                                    label: q,
                                    value: q,
                                }))}
                                label={MESSAGES.quarter}
                            />
                        )}

                        {periodType === PERIOD_TYPE_SIX_MONTH && (
                            <InputComponent
                                keyValue="semester"
                                onChange={handleChange}
                                required
                                clearable={false}
                                value={currentPeriod.semester}
                                type="select"
                                options={getIntegerArray(2).map(s => ({
                                    label: s,
                                    value: s,
                                }))}
                                label={MESSAGES.six_month}
                            />
                        )}
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};
PeriodPicker.defaultProps = {
    periodType: PERIOD_TYPE_MONTH,
};

PeriodPicker.propTypes = {
    periodType: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    title: PropTypes.string.isRequired,
};

export default PeriodPicker;
