import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Box, makeStyles, Grid } from '@material-ui/core';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { useSelector } from 'react-redux';

import TopBar from '../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';

import { CampaignsCalendar } from '../components/campaignCalendar';
import { getCampaignColor } from '../constants/campaignsColors';
import { CalendarMap } from '../components/campaignCalendar/map/CalendarMap';
import {
    mapCampaigns,
    filterCampaigns,
    getCalendarData,
} from '../components/campaignCalendar/utils';

import {
    dateFormat,
    defaultOrder,
} from '../components/campaignCalendar/constants';
import { useGetCampaigns } from '../hooks/useGetCampaigns';
import MESSAGES from '../constants/messages';
import { CALENDAR_BASE_URL } from '../constants/routes';
import { Filters } from '../components/campaignCalendar/Filters';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Calendar = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const isLogged = useSelector(state => Boolean(state.users.current));
    const orders = params.order || defaultOrder;
    const { query } = useGetCampaigns({
        order: orders,
        countries: params.countries,
        search: params.search,
        r1StartFrom: params.r1StartFrom,
        r1StartTo: params.r1StartTo,
    });

    const { data: campaigns = [], status } = query;

    const currentDate = params.currentDate
        ? moment(params.currentDate, dateFormat)
        : moment();

    const currentMonday = currentDate.clone().startOf('isoWeek');
    const calendarData = useMemo(
        () => getCalendarData(currentMonday),
        [currentMonday],
    );

    const mappedCampaigns = useMemo(() => mapCampaigns(campaigns), [campaigns]);
    const filteredCampaigns = useMemo(
        () =>
            filterCampaigns(
                mappedCampaigns,
                calendarData.firstMonday,
                calendarData.lastSunday,
            ).map((c, index) => ({ ...c, color: getCampaignColor(index) })),
        [mappedCampaigns, calendarData.firstMonday, calendarData.lastSunday],
    );
    const loadingCampaigns = status === 'loading';
    return (
        <div>
            {isLogged && (
                <TopBar
                    title={formatMessage(MESSAGES.calendar)}
                    displayBackButton={false}
                />
            )}
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Box mb={4}>
                    <Filters params={params} baseUrl={CALENDAR_BASE_URL} />
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12} lg={8}>
                        <CampaignsCalendar
                            currentDate={currentDate}
                            params={params}
                            orders={orders}
                            campaigns={filteredCampaigns}
                            calendarData={calendarData}
                            currentMonday={currentMonday}
                            loadingCampaigns={loadingCampaigns}
                        />
                    </Grid>
                    <Grid item xs={12} lg={4}>
                        <CalendarMap
                            campaigns={filteredCampaigns}
                            loadingCampaigns={loadingCampaigns}
                        />
                    </Grid>
                </Grid>
            </Box>
        </div>
    );
};

Calendar.propTypes = {
    params: PropTypes.object.isRequired,
};

export { Calendar };
