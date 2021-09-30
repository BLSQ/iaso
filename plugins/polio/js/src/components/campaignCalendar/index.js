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
}) => {
    const classes = useStyles();
    const { headers, currentWeekIndex, firstMonday, lastSunday } = calendarData;

    return (
        <>
            <Box
                mb={2}
                mt={2}
                display="flex"
                alignItems="flex-start"
                position="relative"
            >
                <Nav currentMonday={currentMonday} />
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
};

export { CampaignsCalendar };
