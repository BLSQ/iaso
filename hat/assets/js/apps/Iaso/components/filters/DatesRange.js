import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { FormControl, Grid, Tooltip, IconButton } from '@material-ui/core';
import Clear from '@material-ui/icons/Clear';
import { injectIntl } from 'bluesquare-components';
import MESSAGES from './messages';

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
        right: theme.spacing(6),
        top: 15,
    },
}));

const DatesRange = ({
    dateFrom,
    dateTo,
    onChangeDate,
    intl: { formatMessage },
}) => {
    const classes = useStyles();
    return (
        <Grid container spacing={4}>
            <Grid item xs={6}>
                <FormControl className={classes.formControl}>
                    <KeyboardDatePicker
                        autoOk
                        disableToolbar
                        variant="inline"
                        maxDate={dateTo === '' ? undefined : dateTo}
                        InputLabelProps={{
                            shrink: Boolean(dateFrom),
                        }}
                        format="DD/MM/YYYY"
                        label={formatMessage(MESSAGES.from)}
                        helperText=""
                        inputVariant="outlined"
                        value={dateFrom === '' ? null : dateFrom}
                        onChange={date =>
                            onChangeDate(
                                'dateFrom',
                                date ? date.format('MM-DD-YYYY') : null,
                            )
                        }
                    />
                    {dateFrom && (
                        <Tooltip arrow title={formatMessage(MESSAGES.clear)}>
                            <IconButton
                                color="inherit"
                                onClick={() => onChangeDate('dateFrom', null)}
                                className={classes.clearDateButton}
                            >
                                <Clear color="primary" />
                            </IconButton>
                        </Tooltip>
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
                        minDate={dateFrom === '' ? undefined : dateFrom}
                        InputLabelProps={{
                            shrink: Boolean(dateTo),
                        }}
                        format="DD/MM/YYYY"
                        label={formatMessage(MESSAGES.to)}
                        helperText=""
                        value={dateTo === '' ? null : dateTo}
                        onChange={date =>
                            onChangeDate(
                                'dateTo',
                                date ? date.format('MM-DD-YYYY') : null,
                            )
                        }
                    />
                    {dateTo && (
                        <Tooltip arrow title={formatMessage(MESSAGES.clear)}>
                            <IconButton
                                color="inherit"
                                onClick={() => onChangeDate('dateTo', null)}
                                className={classes.clearDateButton}
                            >
                                <Clear color="primary" />
                            </IconButton>
                        </Tooltip>
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
};

DatesRange.propTypes = {
    onChangeDate: PropTypes.func,
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string,
    intl: PropTypes.object.isRequired,
};

const DatesRangeIntl = injectIntl(DatesRange);

export default DatesRangeIntl;
