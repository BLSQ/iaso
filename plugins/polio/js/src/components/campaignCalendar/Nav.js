import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import { Box, Button, Popper, ClickAwayListener } from '@material-ui/core';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ArrowForward from '@material-ui/icons/ArrowForward';
import { KeyboardDatePicker } from '@material-ui/pickers';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ArrowBack from '@material-ui/icons/ArrowBack';
import Today from '@material-ui/icons/Today';

import { formatPattern, Link, withRouter } from 'react-router';

import { redirectTo } from '../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { useStyles } from './Styles';
import { dateFormat } from './constants';
import { CALENDAR_BASE_URL } from '../../constants/routes';

const genUrl = (router, params) => formatPattern(router.routes[0].path, params);

const Nav = ({ currentMonday, router, currentDate }) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const [anchorEl, setAnchorEl] = useState(null);
    const urlForDate = date =>
        genUrl(router, {
            ...router.params,
            currentDate: date.format(dateFormat),
        });

    const handleClickDate = event => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };
    const handleDateChange = newDate => {
        handleClickDate();
        dispatch(
            redirectTo(CALENDAR_BASE_URL, {
                ...router.params,
                currentDate: newDate,
            }),
        );
    };
    const prev = range => currentMonday.clone().subtract(range, 'week');
    const next = range => currentMonday.clone().add(range, 'week');
    const open = Boolean(anchorEl);
    return (
        <Box className={classes.nav}>
            <Link to={urlForDate(prev(4))}>
                <Button
                    className={classes.navButton}
                    size="small"
                    variant="outlined"
                    color="primary"
                >
                    <ArrowBack />
                </Button>
            </Link>
            <Link to={urlForDate(prev(1))}>
                <Button
                    className={classes.navButton}
                    size="small"
                    variant="outlined"
                    color="primary"
                >
                    <ChevronLeft />
                </Button>
            </Link>
            <Button
                onClick={handleClickDate}
                className={classes.navButton}
                size="small"
                variant="outlined"
                color="primary"
            >
                <Today />
            </Button>
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
                <Button
                    className={classes.navButton}
                    size="small"
                    variant="outlined"
                    color="primary"
                >
                    <ChevronRight color="primary" />
                </Button>
            </Link>
            <Link to={urlForDate(next(4))}>
                <Button
                    className={classes.navButton}
                    size="small"
                    variant="outlined"
                    color="primary"
                >
                    <ArrowForward color="primary" />
                </Button>
            </Link>
        </Box>
    );
};

Nav.propTypes = {
    currentMonday: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    currentDate: PropTypes.object.isRequired,
};
const wrappedNav = withRouter(Nav);
export { wrappedNav as Nav };
