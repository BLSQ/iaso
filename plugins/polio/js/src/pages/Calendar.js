import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Box, makeStyles } from '@material-ui/core';
import { commonStyles } from 'bluesquare-components';
import TopBar from '../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';

import { CampaignsCalendar } from '../components/campaignCalendar';
import { CalendarMap } from '../components/MapComponent/CalendarMap';
import {
    mapCampaigns,
    filterCampaigns,
    getCalendarData,
} from '../components/campaignCalendar/utils';

import { dateFormat } from '../components/campaignCalendar/constants';
import { useGetCampaigns } from '../hooks/useGetCampaigns';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Calendar = ({ params }) => {
    const classes = useStyles();
    const { query } = useGetCampaigns({
        order: 'top_level_org_unit_name',
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
            ),
        [mappedCampaigns, calendarData.firstMonday, calendarData.lastSunday],
    );
    return (
        <div>
            <TopBar title="Calendar" displayBackButton={false} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Box width={1} position="relative">
                    <CampaignsCalendar
                        campaigns={filteredCampaigns}
                        calendarData={calendarData}
                        currentMonday={currentMonday}
                        loadingCampaigns={status === 'loading'}
                    />
                </Box>
                <Box width={1}>
                    <CalendarMap
                        campaigns={filteredCampaigns}
                        loadingCampaigns={status === 'loading'}
                    />
                </Box>
            </Box>
        </div>
    );
};

Calendar.propTypes = {
    params: PropTypes.object.isRequired,
};

export { Calendar };
