import { LoadingSpinner } from 'bluesquare-components';
import { Moment } from 'moment';
import React, { FunctionComponent } from 'react';

import { Box, Table, TableContainer } from '@mui/material';

import { useStyles } from './Styles';

import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { Body } from './Body';
import { Head } from './Head';
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
    router: Router;
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
    router,
}) => {
    const classes = useStyles();
    const { headers, currentWeekIndex, firstMonday, lastSunday } = calendarData;
    return (
        <Box mb={2} display="flex" alignItems="flex-start" position="relative">
            {!isPdf && (
                <Nav
                    currentMonday={currentMonday}
                    params={params}
                    currentDate={currentDate}
                />
            )}
            <TableContainer
                className={
                    !isPdf ? classes.tableContainer : classes.tableContainerPdf
                }
            >
                {loadingCampaigns && <LoadingSpinner absolute />}
                <Table stickyHeader size="small">
                    <Head
                        headers={headers}
                        orders={orders}
                        currentWeekIndex={currentWeekIndex}
                        isPdf={isPdf}
                        router={router}
                    />
                    <Body
                        loadingCampaigns={loadingCampaigns}
                        campaigns={campaigns}
                        currentWeekIndex={currentWeekIndex}
                        firstMonday={firstMonday}
                        lastSunday={lastSunday}
                        isPdf={isPdf}
                        params={params}
                    />
                </Table>
            </TableContainer>
        </Box>
    );
};

export { CampaignsCalendar };
