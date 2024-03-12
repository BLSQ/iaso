import React, { FunctionComponent } from 'react';
import { Moment } from 'moment';
import { LoadingSpinner } from 'bluesquare-components';

import { Table, TableContainer, Box } from '@mui/material';

import { useStyles } from './Styles';

import { Head } from './Head';
import { Body } from './Body';
import { Nav } from './Nav';
import { CalendarData, CalendarParams, MappedCampaign } from './types';

type Props = {
    campaigns: MappedCampaign[];
    calendarData: CalendarData;
    currentMonday: Moment;
    loadingCampaigns: boolean;
    params: CalendarParams;
    orders: string;
    currentDate: Moment;
    isPdf?: boolean;
};

const CampaignsCalendar: FunctionComponent<Props> = ({
    campaigns,
    calendarData,
    currentMonday,
    loadingCampaigns,
    params,
    orders,
    currentDate,
    isPdf = false,
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
                <Table stickyHeader>
                    <Head
                        headers={headers}
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

export { CampaignsCalendar };
