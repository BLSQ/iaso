import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { replace } from 'react-router-redux';
import { useDispatch } from 'react-redux';

import {
    Box,
    Button,
    Popper,
    ClickAwayListener,
    Tooltip,
} from '@material-ui/core';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ArrowForward from '@material-ui/icons/ArrowForward';
import { KeyboardDatePicker } from '@material-ui/pickers';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ArrowBack from '@material-ui/icons/ArrowBack';
import Today from '@material-ui/icons/Today';
import { useSafeIntl } from 'bluesquare-components';

import { Link, withRouter } from 'react-router';

import { useStyles } from './Styles';
import { dateFormat } from './constants';

import { genUrl } from '../../../../../../hat/assets/js/apps/Iaso/routing/routing.ts';
import MESSAGES from '../../constants/messages';

const Nav = ({ currentMonday, router, currentDate }) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();
    const [anchorEl, setAnchorEl] = useState(null);
    const urlForDate = date =>
        genUrl(router, {
            currentDate: date.format(dateFormat),
        });

    const handleClickDate = event => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };
    const handleDateChange = newDate => {
        handleClickDate();
        const url = genUrl(router, {
            currentDate: newDate,
        });
        dispatch(replace(url));
    };
    const prev = range => currentMonday.clone().subtract(range, 'week');
    const next = range => currentMonday.clone().add(range, 'week');
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
                        id="color-picker"
                        open={open}
                        anchorEl={anchorEl}
                        placement="bottom"
                        className={classes.popper}
                    >
                        <KeyboardDatePicker
                            autoOk
                            disableToolbar
                            variant="static"
                            format={dateFormat}
                            label=""
                            helperText=""
                            value={currentDate.format(dateFormat)}
                            onChange={date =>
                                handleDateChange(date.format(dateFormat))
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

Nav.propTypes = {
    currentMonday: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    currentDate: PropTypes.object.isRequired,
};
const wrappedNav = withRouter(Nav);
export { wrappedNav as Nav };
