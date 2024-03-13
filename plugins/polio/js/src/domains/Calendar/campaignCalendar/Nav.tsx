import React, { useState, FunctionComponent } from 'react';
import { replace } from 'react-router-redux';
import { useDispatch } from 'react-redux';

import {
    Box,
    Button,
    Popper,
    ClickAwayListener,
    Tooltip,
    TextField,
} from '@mui/material';

import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ArrowForward from '@mui/icons-material/ArrowForward';
import { DesktopDatePicker as DatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Today from '@mui/icons-material/Today';
import { useSafeIntl } from 'bluesquare-components';

import { Link, withRouter } from 'react-router';

import { useStyles } from './Styles';
import { dateFormat } from './constants';

import { genUrl } from '../../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import MESSAGES from '../../../constants/messages';
import moment, { Moment} from 'moment';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';

type Props =  {
    currentMonday: Moment;
    router: Router;
    currentDate: Moment;
}

const Nav: FunctionComponent<Props> = ({ currentMonday, router, currentDate }) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const urlForDate = (date: Moment) =>
        genUrl(router, {
            currentDate: date.format(dateFormat),
        });

    const handleClickDate = (event?: React.MouseEvent<HTMLElement> | MouseEvent | TouchEvent) => {
        if (event && 'currentTarget' in event) {
            setAnchorEl(anchorEl ? null : event.currentTarget as HTMLElement);
        } else {
            setAnchorEl(null);
        }
    };
    const handleDateChange = (newDate: string) => {
        handleClickDate();
        console.log('newDate', newDate)
        const url = genUrl(router, {
            currentDate: newDate,
        });
        dispatch(replace(url));
    };
    const prev = (range: number) => currentMonday.clone().subtract(range, 'week');
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
                            renderInput={(props) => <TextField {...props} />}
                            value={currentDate.format(dateFormat)}
                            onChange={(date) =>
                                date ? handleDateChange(moment(date).format(dateFormat)) : null
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

const wrappedNav = withRouter(Nav);
export { wrappedNav as Nav };
