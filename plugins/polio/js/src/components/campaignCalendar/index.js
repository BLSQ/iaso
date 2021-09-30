import React from 'react';
import PropTypes from 'prop-types';

import classnames from 'classnames';
import { LoadingSpinner } from 'bluesquare-components';

import { Box, Button, Table, TableContainer } from '@material-ui/core';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';

import { withRouter, formatPattern } from 'react-router';
import { useStyles } from './Styles';
import { dateFormat } from './constants';

import { Head } from './Head';
import { Body } from './Body';
import { useReplace } from '../../../../../../hat/assets/js/apps/Iaso/routing/hooks';

const CampaignsCalendar = ({
    campaigns,
    calendarData,
    currentMonday,
    loadingCampaigns,
    router,
}) => {
    const classes = useStyles();
    const replaceTo = useReplace();

    const { headers, currentWeekIndex, firstMonday, lastSunday } = calendarData;

    const handleGoNext = () => {
        const newDate = currentMonday.clone().add(4, 'week');
        replaceTo(
            formatPattern(router.routes[0].path, {
                currentDate: newDate.format(dateFormat),
            }),
        );
    };
    const handleGoPrev = () => {
        const newDate = currentMonday.clone().subtract(4, 'week');
        replaceTo(
            formatPattern(router.routes[0].path, {
                currentDate: newDate.format(dateFormat),
            }),
        );
    };

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
                    <Button
                        onClick={handleGoPrev}
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
                    <Button
                        onClick={handleGoNext}
                        className={classes.navButton}
                        size="large"
                        variant="outlined"
                        color="primary"
                    >
                        <ChevronRight color="primary" />
                    </Button>
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
