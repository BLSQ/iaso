import React from 'react';
import PropTypes from 'prop-types';

import classnames from 'classnames';
import { LoadingSpinner } from 'bluesquare-components';

import { Box, Button, Table, TableContainer } from '@material-ui/core';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';

import { withRouter, formatPattern, Link } from 'react-router';
import { useStyles } from './Styles';
import { dateFormat } from './constants';

import { Head } from './Head';
import { Body } from './Body';

const CampaignsCalendar = ({
    campaigns,
    calendarData,
    currentMonday,
    loadingCampaigns,
    router,
}) => {
    const classes = useStyles();

    const { headers, currentWeekIndex, firstMonday, lastSunday } = calendarData;
    const nextMonth = currentMonday.clone().add(4, 'week');
    const nextMonthLink = formatPattern(router.routes[0].path, {
        currentDate: nextMonth.format(dateFormat),
    });
    const prevMonth = currentMonday.clone().subtract(4, 'week');
    const prevMonthLink = formatPattern(router.routes[0].path, {
        currentDate: prevMonth.format(dateFormat),
    });

    return (
        <>
            <Box
                mb={2}
                mt={2}
                display="flex"
                alignItems="flex-start"
                position="relative"
            >
                <Box className={classes.nav}>
                    <Link to={prevMonthLink}>
                        <Button
                            className={classnames(
                                classes.navButton,
                                classes.navButtonPrev,
                            )}
                            size="large"
                            variant="outlined"
                            color="primary"
                        >
                            <ChevronLeft />
                        </Button>
                    </Link>
                    <Link to={nextMonthLink}>
                        <Button
                            className={classes.navButton}
                            size="large"
                            variant="outlined"
                            color="primary"
                        >
                            <ChevronRight color="primary" />
                        </Button>
                    </Link>
                </Box>
                <TableContainer className={classes.tableContainer}>
                    {loadingCampaigns && <LoadingSpinner absolute />}
                    <Table stickyHeader>
                        <Head headers={headers} />
                        <Body
                            campaigns={campaigns}
                            currentWeekIndex={currentWeekIndex}
                            firstMonday={firstMonday}
                            lastSunday={lastSunday}
                        />
                    </Table>
                </TableContainer>
            </Box>
        </>
    );
};

CampaignsCalendar.defaultProps = {
    campaigns: [],
};

CampaignsCalendar.propTypes = {
    campaigns: PropTypes.array,
    calendarData: PropTypes.object.isRequired,
    currentMonday: PropTypes.object.isRequired,
    loadingCampaigns: PropTypes.bool.isRequired,
    router: PropTypes.shape.isRequired,
};

const wrappedCampaignsCalendar = withRouter(CampaignsCalendar);
export { wrappedCampaignsCalendar as CampaignsCalendar };
