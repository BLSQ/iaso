import React, { FunctionComponent } from 'react';
// @ts-ignore

import { Box, Table, TableContainer } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import { Moment } from 'moment';

import { Body } from './Body';
import { Head } from './Head';
import { Nav } from './Nav';
import { useStyles } from './Styles';
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
    url: string;
    isLogged: boolean;
};

const CampaignsCalendar: FunctionComponent<Props> = ({
    campaigns,
    calendarData,
    currentMonday,
    loadingCampaigns,
    params,
    orders,
    currentDate,
    url,
    isLogged,
    isPdf = false,
}) => {
    const classes = useStyles();
    const { headers, currentWeekIndex, firstMonday, lastSunday } = calendarData;
    return (
        <Box mb={2} display="flex" alignItems="flex-start" position="relative">
            {!isPdf && (
                <Nav
                    currentMonday={currentMonday}
                    url={url}
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
                        isLogged={isLogged}
                        url={url}
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
