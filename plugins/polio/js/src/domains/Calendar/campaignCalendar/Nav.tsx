import React, { FunctionComponent, useState } from 'react';

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
import { useSafeIntl } from 'bluesquare-components';
import { Link } from 'react-router-dom';
import moment, { Moment } from 'moment';
import { useStyles } from './Styles';
import { dateFormat } from './constants';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../constants/messages';

type Props = {
    currentMonday: Moment;
    router: Router;
    currentDate: Moment;
};

export const Nav: FunctionComponent<Props> = ({
    currentMonday,
    currentDate,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const urlForDate = (date: Moment) => '/home';
    // genUrl(router, {
    //     currentDate: date.format(dateFormat),
    // });

    const handleClickDate = (
        event?: React.MouseEvent<HTMLElement> | MouseEvent | TouchEvent,
    ) => {
        if (event && 'currentTarget' in event) {
            setAnchorEl(anchorEl ? null : (event.currentTarget as HTMLElement));
        } else {
            setAnchorEl(null);
        }
    };
    const handleDateChange = (newDate: string) => {
        handleClickDate();
        // const url = genUrl(router, {
        //     currentDate: newDate,
        // });
        // dispatch(replace(url));
    };
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
