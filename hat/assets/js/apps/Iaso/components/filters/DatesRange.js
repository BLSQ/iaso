import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { KeyboardDatePicker } from '@material-ui/pickers';

import { FormControl, Grid, useTheme, useMediaQuery } from '@material-ui/core';
import { injectIntl, IconButton } from 'bluesquare-components';
import EventIcon from '@material-ui/icons/Event';
import MESSAGES from './messages';
import {
    getUrlParamDateObject,
    dateFormat,
    getLocaleDateFormat,
} from '../../utils/dates.ts';

const useStyles = makeStyles(theme => ({
    formControl: {
        width: '100%',
        marginBottom: theme.spacing(),
        marginTop: theme.spacing(),
    },
    clearDateButton: {
        marginRight: theme.spacing(2),
        padding: 0,
        position: 'absolute',
        right: theme.spacing(4),
        top: 13,
    },
}));

const useCurrentBreakPointSpacing = (xs, sm, md, lg) => {
    const theme = useTheme();
    const isXs = useMediaQuery(
        theme.breakpoints.down('xs') || theme.breakpoints.between('xs', 'sm'),
    );
    const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
    const isLg = useMediaQuery(theme.breakpoints.between('lg', 'xl'));
    const isXl = useMediaQuery(theme.breakpoints.up('xl'));
    if (
        (isXs && xs < 12) ||
        (isSm && sm < 12) ||
        (isMd && md < 12) ||
        (isLg && lg < 12) ||
        (isXl && lg < 12)
    ) {
        return 2;
    }

    return 0;
};

const DatesRange = ({
    dateFrom,
    dateTo,
    onChangeDate,
    intl: { formatMessage },
    labelTo,
    labelFrom,
    xs,
    sm,
    md,
    lg,
    keyDateFrom = 'dateFrom',
    keyDateTo = 'dateTo',
}) => {
    const classes = useStyles();
    const [from, setFrom] = useState(dateFrom);
    const [to, setTo] = useState(dateTo);
    // Converting the displayedDateFormat to this one onChange to avoid a nasty bug in Firefox
    return (
        <Grid container spacing={useCurrentBreakPointSpacing(xs, sm, md, lg)}>
            <Grid item xs={xs} sm={sm} md={md} lg={lg}>
                <FormControl className={classes.formControl}>
                    <KeyboardDatePicker
                        autoOk
                        disableToolbar
                        variant="inline"
                        maxDate={
                            dateTo === '' || dateTo === null
                                ? undefined
                                : getUrlParamDateObject(dateTo)
                        }
                        InputLabelProps={{
                            shrink: Boolean(from),
                        }}
                        InputProps={{
                            'data-test': 'start-date',
                        }}
                        KeyboardButtonProps={{
                            size: 'small',
                        }}
                        keyboardIcon={<EventIcon size="small" />}
                        format={getLocaleDateFormat('L')}
                        label={formatMessage(labelFrom)}
                        helperText=""
                        inputVariant="outlined"
                        value={
                            from === '' || from === null
                                ? null
                                : getUrlParamDateObject(from)
                        }
                        onChange={date => {
                            setFrom(date);
                            onChangeDate(
                                keyDateFrom,
                                date && date.isValid()
                                    ? date.format(dateFormat)
                                    : undefined,
                            );
                        }}
                    />
                    {dateFrom && (
                        <span className={classes.clearDateButton}>
                            <IconButton
                                size="small"
                                icon="clear"
                                tooltipMessage={MESSAGES.clear}
                                onClick={() => {
                                    setFrom('');
                                    onChangeDate(keyDateFrom, undefined);
                                }}
                            />
                        </span>
                    )}
                </FormControl>
            </Grid>
            <Grid item xs={xs} sm={sm} md={md} lg={lg}>
                <FormControl className={classes.formControl}>
                    <KeyboardDatePicker
                        autoOk
                        disableToolbar
                        inputVariant="outlined"
                        variant="inline"
                        minDate={
                            dateFrom === '' || dateFrom === null
                                ? undefined
                                : getUrlParamDateObject(dateFrom)
                        }
                        InputLabelProps={{
                            shrink: Boolean(to),
                        }}
                        InputProps={{
                            'data-test': 'end-date',
                        }}
                        KeyboardButtonProps={{
                            size: 'small',
                        }}
                        keyboardIcon={<EventIcon size="small" />}
                        format={getLocaleDateFormat('L')}
                        label={formatMessage(labelTo)}
                        helperText=""
                        value={
                            to === '' || to === null
                                ? null
                                : getUrlParamDateObject(to)
                        }
                        onChange={date => {
                            setTo(date);
                            onChangeDate(
                                keyDateTo,
                                date && date.isValid()
                                    ? date.format(dateFormat)
                                    : undefined,
                            );
                        }}
                    />
                    {dateTo && (
                        <span className={classes.clearDateButton}>
                            <IconButton
                                size="small"
                                icon="clear"
                                tooltipMessage={MESSAGES.clear}
                                onClick={() => {
                                    setTo('');
                                    onChangeDate(keyDateTo, undefined);
                                }}
                            />
                        </span>
                    )}
                </FormControl>
            </Grid>
        </Grid>
    );
};

DatesRange.defaultProps = {
    dateFrom: '',
    dateTo: '',
    onChangeDate: () => null,
    labelTo: MESSAGES.to,
    labelFrom: MESSAGES.from,
    xs: 6,
    sm: 6,
    md: 6,
    lg: 6,
    keyDateFrom: 'dateFrom',
    keyDateTo: 'dateTo',
};

DatesRange.propTypes = {
    onChangeDate: PropTypes.func,
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string,
    intl: PropTypes.object.isRequired,
    labelTo: PropTypes.object,
    labelFrom: PropTypes.object,
    xs: PropTypes.number,
    sm: PropTypes.number,
    md: PropTypes.number,
    lg: PropTypes.number,
    keyDateFrom: PropTypes.string,
    keyDateTo: PropTypes.string,
};

const DatesRangeIntl = injectIntl(DatesRange);

export default DatesRangeIntl;
