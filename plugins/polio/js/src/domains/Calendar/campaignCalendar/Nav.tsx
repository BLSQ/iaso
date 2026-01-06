import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    Box,
    Button,
    ClickAwayListener,
    Popper,
    TextField,
    Tooltip,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ArrowForward from '@mui/icons-material/ArrowForward';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Today from '@mui/icons-material/Today';
import { DesktopDatePicker as DatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import {
    useSafeIntl,
    useRedirectToReplace,
    convertObjectToUrlParams,
} from 'bluesquare-components';
import { Link } from 'react-router-dom';
import moment, { Moment } from 'moment';
import { useStyles } from './Styles';
import { dateFormat } from './constants';
import MESSAGES from '../../../constants/messages';
import { GenUrlFunction } from 'Iaso/routing/routing';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';

type Props = {
    currentMonday: Moment;
    currentDate: Moment;
    url: string;
};

const useGenUrl = (url: string): GenUrlFunction => {
    const currentParams = useParamsObject(url);
    return useCallback(
        (
            newParams: Record<string, string | number | null | undefined>,
        ): string => {
            const updatedParams = { ...currentParams, ...newParams };
            const paramsAsString = convertObjectToUrlParams(updatedParams);
            return `/${url}${paramsAsString}`;
        },
        [url, currentParams],
    );
};

export const Nav: FunctionComponent<Props> = ({
    currentMonday,
    currentDate,
    url,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const genUrl = useGenUrl(url);
    const redirectToReplace = useRedirectToReplace();
    const urlForDate = useCallback(
        (date: Moment) =>
            genUrl({
                currentDate: date.format(dateFormat),
            }),
        [genUrl],
    );

    const handleClickDate = useCallback(
        (event?: React.MouseEvent<HTMLElement> | MouseEvent | TouchEvent) => {
            if (event && 'currentTarget' in event) {
                setAnchorEl(
                    anchorEl ? null : (event.currentTarget as HTMLElement),
                );
            } else {
                setAnchorEl(null);
            }
        },
        [anchorEl],
    );
    const handleDateChange = useCallback(
        (newDate: string) => {
            handleClickDate();
            redirectToReplace(url, {
                currentDate: newDate,
            });
        },
        [handleClickDate, redirectToReplace, url],
    );
    const prev = (range: number) =>
        currentMonday.clone().subtract(range, 'week');
    const next = (range: number) => currentMonday.clone().add(range, 'week');
    const open = Boolean(anchorEl);
    return (
        <Box className={classes.nav}>
            <Link to={urlForDate(prev(4))}>
                <Tooltip arrow title={formatMessage(MESSAGES.fastPrevious)}>
                    <Button
                        className={classes.navButton}
                        size="small"
                        variant="outlined"
                        color="primary"
                    >
                        <ArrowBack />
                    </Button>
                </Tooltip>
            </Link>
            <Link to={urlForDate(prev(1))}>
                <Tooltip arrow title={formatMessage(MESSAGES.previous)}>
                    <Button
                        className={classes.navButton}
                        size="small"
                        variant="outlined"
                        color="primary"
                    >
                        <ChevronLeft />
                    </Button>
                </Tooltip>
            </Link>
            <span>
                <Tooltip arrow title={formatMessage(MESSAGES.selectDate)}>
                    <Button
                        onClick={handleClickDate}
                        className={classes.navButton}
                        size="small"
                        variant="outlined"
                        color="primary"
                    >
                        <Today />
                    </Button>
                </Tooltip>
            </span>
            {open && (
                <ClickAwayListener onClickAway={handleClickDate}>
                    <Popper
                        id="date-picker"
                        open={open}
                        anchorEl={anchorEl}
                        placement="bottom"
                        className={classes.popper}
                    >
                        <DatePicker
                            label=""
                            renderInput={props => <TextField {...props} />}
                            value={currentDate.format(dateFormat)}
                            onChange={date =>
                                date
                                    ? handleDateChange(
                                          moment(date).format(dateFormat),
                                      )
                                    : undefined
                            }
                        />
                    </Popper>
                </ClickAwayListener>
            )}

            <Link to={urlForDate(next(1))}>
                <Tooltip arrow title={formatMessage(MESSAGES.next)}>
                    <Button
                        className={classes.navButton}
                        size="small"
                        variant="outlined"
                        color="primary"
                    >
                        <ChevronRight color="primary" />
                    </Button>
                </Tooltip>
            </Link>
            <Link to={urlForDate(next(4))}>
                <Tooltip arrow title={formatMessage(MESSAGES.fastNext)}>
                    <Button
                        className={classes.navButton}
                        size="small"
                        variant="outlined"
                        color="primary"
                    >
                        <ArrowForward color="primary" />
                    </Button>
                </Tooltip>
            </Link>
        </Box>
    );
};
