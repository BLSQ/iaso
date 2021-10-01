import React from 'react';
import PropTypes from 'prop-types';

import { Box, Button } from '@material-ui/core';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ArrowForward from '@material-ui/icons/ArrowForward';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ArrowBack from '@material-ui/icons/ArrowBack';
import Today from '@material-ui/icons/Today';

import moment from 'moment';

import { formatPattern, Link, withRouter } from 'react-router';
import { useStyles } from './Styles';
import { dateFormat } from './constants';

const genUrl = (router, params) => formatPattern(router.routes[0].path, params);

const Nav = ({ currentMonday, router }) => {
    const classes = useStyles();
    const urlForDate = date =>
        genUrl(router, {
            currentDate: date.format(dateFormat),
        });
    const urlToday = urlForDate(moment().startOf('isoWeek'));

    const prev = range => currentMonday.clone().subtract(range, 'week');
    const next = range => currentMonday.clone().subtract(range, 'week');
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
            <Link to={urlToday}>
                <Button
                    className={classes.navButton}
                    size="small"
                    variant="outlined"
                    color="primary"
                >
                    <Today />
                </Button>
            </Link>
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
    router: PropTypes.shape.isRequired,
};
const wrappedNav = withRouter(Nav);
export { wrappedNav as Nav };
