import React, { useState, useCallback, FunctionComponent } from 'react';
import EventIcon from '@mui/icons-material/Event';
import { Grid, useTheme, useMediaQuery, Box, TextField } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { DesktopDatePicker as DatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import {
    useSafeIntl,
    IconButton,
    FormControl,
    useSkipEffectOnMount,
    IntlMessage,
} from 'bluesquare-components';
import { Moment } from 'moment';
import {
    getUrlParamDateObject,
    dateFormat,
    getLocaleDateFormat,
} from '../../utils/dates';
import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
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
/**
 * There's a conflict of format between the way we display it in the picker (DD-MM-YYY) and the way we should send it to the server (YYY-MM-DD)
 * The workaround is to convert the output (DD-MM-YYYY) to the YYY-MM-DD expected format when saving the form/when sending the request to the backend
 * with `dateRangePickerToDateApi` /iaso/hat/assets/js/apps/Iaso/utils/dates.ts.
 * Similarly, when setting the value of the `dateFrom `and `dateTo` props from url params, it should be converted using dateApiToDateRangePicker from the same file.
 *
 */

type Props = {
    onChangeDate?: (keyValue: string, date?: string) => void;
    dateFrom?: string;
    dateTo?: string;
    labelTo?: IntlMessage;
    labelFrom?: IntlMessage;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    keyDateFrom?: string;
    keyDateTo?: string;
    errors?: [any[], any[]];
    blockInvalidDates?: boolean;
    marginTop?: number;
    dateFromRequired?: boolean;
    dateToRequired?: boolean;
    disabled?: boolean;
};

const DatesRange: FunctionComponent<Props> = ({
    dateFrom = '',
    dateTo = '',
    onChangeDate = () => null,
    labelTo = MESSAGES.to,
    labelFrom = MESSAGES.from,
    xs = 6,
    sm = 6,
    md = 6,
    lg = 6,
    keyDateFrom = 'dateFrom',
    keyDateTo = 'dateTo',
    errors = [[], []],
    blockInvalidDates = true,
    marginTop = 2,
    dateFromRequired = false,
    dateToRequired = false,
    disabled = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const [from, setFrom] = useState<string | Moment | null>(dateFrom);
    const [to, setTo] = useState<string | Moment | null>(dateTo);

    const handleChange = useCallback(
        (keyValue, date) => {
            if (blockInvalidDates) {
                onChangeDate(
                    keyValue,
                    date && date.isValid()
                        ? date.format(dateFormat)
                        : undefined,
                );
            } else {
                onChangeDate(keyValue, date?.format(dateFormat));
            }
        },
        [blockInvalidDates, onChangeDate],
    );
    useSkipEffectOnMount(() => {
        if (from !== dateFrom) {
            setFrom(dateFrom);
        }
    }, [dateFrom]);
    useSkipEffectOnMount(() => {
        if (to !== dateTo) {
            setTo(dateTo);
        }
    }, [dateTo]);
    console.log(getLocaleDateFormat('L'));
    // Converting the displayedDateFormat to this one onChange to avoid a nasty bug in Firefox
    return (
        <Grid container spacing={useCurrentBreakPointSpacing(xs, sm, md, lg)}>
            <Grid item xs={xs} sm={sm} md={md} lg={lg}>
                <Box mt={marginTop}>
                    <FormControl errors={errors[0]}>
                        <DatePicker
                            autoOk
                            renderInput={props => <TextField {...props} />}
                            disableToolbar
                            required={dateFromRequired}
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
                                //@ts-ignore
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
                                handleChange(keyDateFrom, date);
                            }}
                            error={errors[0].length > 0}
                            disabled={disabled}
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
                </Box>
            </Grid>
            <Grid item xs={xs} sm={sm} md={md} lg={lg}>
                <Box mt={marginTop}>
                    <FormControl errors={errors[1]}>
                        <DatePicker
                            autoOk
                            renderInput={props => <TextField {...props} />}
                            disableToolbar
                            required={dateToRequired}
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
                                handleChange(keyDateTo, date);
                            }}
                            error={errors[1].length > 0}
                            disabled={disabled}
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
                </Box>
            </Grid>
        </Grid>
    );
};

export default DatesRange;
