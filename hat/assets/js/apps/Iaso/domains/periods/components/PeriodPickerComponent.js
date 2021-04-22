import React, { useState, useEffect } from 'react';

import { makeStyles, Grid, Box, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';

import InputComponent from '../../../components/forms/InputComponent';

import { getYears, getIntegerArray } from '../../../utils';
import { getDefaultPeriodString } from '../utils';
import commonStyles from '../../../styles/common';
import { Period } from '../models';
import { useSafeIntl } from '../../../hooks/intl';
import {
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_SIX_MONTH,
    PERIOD_TYPE_YEAR,
    MONTHS,
    QUARTERS,
    SEMESTERS,
} from '../constants';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    title: {
        fontSize: 17,
        marginBottom: theme.spacing(1),
        color: 'rgba(0, 0, 0, 0.7)',
    },
}));

const PeriodPicker = ({ periodType, title, onChange, activePeriodString }) => {
    const classes = useStyles();
    const intl = useSafeIntl();
    const [currentPeriod, setCurrentPeriod] = useState(null);

    const handleChange = (keyName, value) => {
        let newPeriodString;
        if (keyName === 'year') {
            newPeriodString = `${value}${Period.padMonth(currentPeriod.month)}`;
        }
        if (keyName === 'month') {
            newPeriodString = `${currentPeriod.year}${Period.padMonth(value)}`;
        }
        if (keyName === 'quarter') {
            newPeriodString = `${currentPeriod.year}${QUARTERS[value]}`;
        }
        if (keyName === 'semester') {
            newPeriodString = `${currentPeriod.year}${SEMESTERS[value]}`;
        }
        if (newPeriodString) {
            onChange(newPeriodString);
        }
    };

    useEffect(() => {
        if (!activePeriodString) {
            onChange(getDefaultPeriodString());
        }
    }, []);

    useEffect(() => {
        if (activePeriodString) {
            setCurrentPeriod(new Period(activePeriodString));
        }
    }, [activePeriodString]);

    console.log('activePeriodString', activePeriodString);
    console.log('currentPeriod', currentPeriod);
    if (!currentPeriod) return null;
    return (
        <Box
            mt={2}
            p={1}
            mb={2}
            border={1}
            borderRadius={5}
            borderColor="rgba(0, 0, 0, 0.23)"
        >
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
                                clearable={false}
                                value={currentPeriod.month}
                                type="select"
                                options={getIntegerArray(12).map(m => ({
                                    label: intl.formatMessage(MONTHS[m]),
                                    value: m,
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
                                    label: QUARTERS[q],
                                    value: q,
                                }))}
                                label={MESSAGES.quarter}
                            />
                        )}

                        {periodType === PERIOD_TYPE_SIX_MONTH && (
                            <InputComponent
                                keyValue="semester"
                                onChange={handleChange}
                                clearable={false}
                                value={currentPeriod.semester}
                                type="select"
                                options={getIntegerArray(2).map(s => ({
                                    label: SEMESTERS[s],
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
    activePeriodString: null,
};

PeriodPicker.propTypes = {
    periodType: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    title: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    activePeriodString: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
};

export default PeriodPicker;
