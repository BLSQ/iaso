import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { FormControl, Grid } from '@material-ui/core';
import { injectIntl, IconButton } from 'bluesquare-components';
import EventIcon from '@material-ui/icons/Event';
import MESSAGES from './messages';
import { getUrlParamDateObject, dateFormat } from '../../utils/dates';

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

const DatesRange = ({
    dateFrom,
    dateTo,
    onChangeDate,
    intl: { formatMessage },
    labelTo,
    labelFrom,
}) => {
    const classes = useStyles();
    // Converting the displayedDateFormat to this one onChange to avoid a nasty bug in Firefox
    return (
        <Grid container spacing={4}>
            <Grid item xs={6}>
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
                            shrink: Boolean(dateFrom),
                        }}
                        KeyboardButtonProps={{
                            size: 'small',
                        }}
                        keyboardIcon={<EventIcon size="small" />}
                        format="L"
                        label={formatMessage(labelFrom)}
                        helperText=""
                        inputVariant="outlined"
                        value={
                            dateFrom === '' || dateFrom === null
                                ? null
                                : getUrlParamDateObject(dateFrom)
                        }
                        onChange={date =>
                            onChangeDate(
                                'dateFrom',
                                date ? date.format(dateFormat) : null,
                            )
                        }
                    />
                    {dateFrom && (
                        <span className={classes.clearDateButton}>
                            <IconButton
                                size="small"
                                icon="clear"
                                tooltipMessage={MESSAGES.clear}
                                onClick={() => onChangeDate('dateFrom', null)}
                            />
                        </span>
                    )}
                </FormControl>
            </Grid>
            <Grid item xs={6}>
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
                            shrink: Boolean(dateTo),
                        }}
                        KeyboardButtonProps={{
                            size: 'small',
                        }}
                        keyboardIcon={<EventIcon size="small" />}
                        format="L"
                        label={formatMessage(labelTo)}
                        helperText=""
                        value={
                            dateTo === '' || dateTo === null
                                ? null
                                : getUrlParamDateObject(dateTo)
                        }
                        onChange={date =>
                            onChangeDate(
                                'dateTo',
                                date ? date.format(dateFormat) : null,
                            )
                        }
                    />
                    {dateTo && (
                        <span className={classes.clearDateButton}>
                            <IconButton
                                size="small"
                                icon="clear"
                                tooltipMessage={MESSAGES.clear}
                                onClick={() => onChangeDate('dateTo', null)}
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
};

DatesRange.propTypes = {
    onChangeDate: PropTypes.func,
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string,
    intl: PropTypes.object.isRequired,
    labelTo: PropTypes.object,
    labelFrom: PropTypes.object,
};

const DatesRangeIntl = injectIntl(DatesRange);

export default DatesRangeIntl;
