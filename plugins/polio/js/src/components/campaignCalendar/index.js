import React from 'react';
import PropTypes from 'prop-types';
import { LoadingSpinner } from 'bluesquare-components';

import { Table, TableContainer, Box } from '@material-ui/core';

import { useStyles } from './Styles';

import { Head } from './Head';
import { Body } from './Body';
import { Nav } from './Nav';

const CampaignsCalendar = ({
    campaigns,
    calendarData,
    currentMonday,
    loadingCampaigns,
    params,
    orders,
    currentDate,
    isPdf,
}) => {
    const classes = useStyles();
    const { headers, currentWeekIndex, firstMonday, lastSunday } = calendarData;

    return (
        <Box mb={2} display="flex" alignItems="flex-start" position="relative">
            <Nav
                currentMonday={currentMonday}
                params={params}
                currentDate={currentDate}
            />
            <TableContainer
                className={
                    !isPdf ? classes.tableContainer : classes.tableContainerPdf
                }
            >
                {loadingCampaigns && <LoadingSpinner absolute />}
                <Table stickyHeader className={classes.table}>
                    <Head
                        headers={headers}
                        params={params}
                        orders={orders}
                        currentWeekIndex={currentWeekIndex}
                        isPdf={isPdf}
                    />
                    <Body
                        loadingCampaigns={loadingCampaigns}
                        campaigns={campaigns}
                        currentWeekIndex={currentWeekIndex}
                        firstMonday={firstMonday}
                        lastSunday={lastSunday}
                        isPdf={isPdf}
                    />
                </Table>
            </TableContainer>
        </Box>
    );
};

CampaignsCalendar.defaultProps = {
    campaigns: [],
    isPdf: false,
};

CampaignsCalendar.propTypes = {
    campaigns: PropTypes.array,
    calendarData: PropTypes.object.isRequired,
    currentMonday: PropTypes.object.isRequired,
    loadingCampaigns: PropTypes.bool.isRequired,
    params: PropTypes.object.isRequired,
    orders: PropTypes.string.isRequired,
    currentDate: PropTypes.object.isRequired,
    isPdf: PropTypes.bool,
};

export { CampaignsCalendar };
