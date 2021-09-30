import React from 'react';
import PropTypes from 'prop-types';

import { Box, Button } from '@material-ui/core';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ArrowForward from '@material-ui/icons/ArrowForward';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ArrowBack from '@material-ui/icons/ArrowBack';
import Today from '@material-ui/icons/Today';
import { useDispatch } from 'react-redux';

import moment from 'moment';
import { redirectToReplace } from '../../../../../../hat/assets/js/apps/Iaso/routing/actions';

import { useStyles } from './Styles';
import { baseUrl, dateFormat } from './constants';

const Nav = ({ currentMonday }) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const handleGoToday = () => {
        dispatch(
            redirectToReplace(baseUrl, {
                currentDate: moment().startOf('isoWeek').format(dateFormat),
            }),
        );
    };
    const handleGoNext = range => {
        const newDate = currentMonday.clone().add(range, 'week');
        dispatch(
            redirectToReplace(baseUrl, {
                currentDate: newDate.format(dateFormat),
            }),
        );
    };
    const handleGoPrev = range => {
        const newDate = currentMonday.clone().subtract(range, 'week');
        dispatch(
            redirectToReplace(baseUrl, {
                currentDate: newDate.format(dateFormat),
            }),
        );
    };
    return (
        <Box className={classes.nav}>
            <Button
                onClick={() => handleGoPrev(4)}
                className={classes.navButton}
                size="small"
                variant="outlined"
                color="primary"
            >
                <ArrowBack />
            </Button>
            <Button
                onClick={() => handleGoPrev(1)}
                className={classes.navButton}
                size="small"
                variant="outlined"
                color="primary"
            >
                <ChevronLeft />
            </Button>
            <Button
                onClick={() => handleGoToday()}
                className={classes.navButton}
                size="small"
                variant="outlined"
                color="primary"
            >
                <Today />
            </Button>
            <Button
                onClick={() => handleGoNext(1)}
                className={classes.navButton}
                size="small"
                variant="outlined"
                color="primary"
            >
                <ChevronRight color="primary" />
            </Button>
            <Button
                onClick={() => handleGoNext(4)}
                className={classes.navButton}
                size="small"
                variant="outlined"
                color="primary"
            >
                <ArrowForward color="primary" />
            </Button>
        </Box>
    );
};

Nav.propTypes = {
    currentMonday: PropTypes.object.isRequired,
};

export { Nav };
