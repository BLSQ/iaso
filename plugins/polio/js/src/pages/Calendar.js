import React, { useMemo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Box, makeStyles, Grid, Button } from '@material-ui/core';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { useSelector } from 'react-redux';

import TopBar from 'Iaso/components/nav/TopBarComponent';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
// @ts-ignore
import MESSAGES from '../constants/messages';
import { Filters } from '../components/campaignCalendar/Filters';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Calendar = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const isLogged = useSelector(state => Boolean(state.users.current));
    const orders = params.order || defaultOrder;
    const queryOptions = useMemo(() => {
        return {
            order: orders,
            countries: params.countries,
            search: params.search,
            campaignType: params.campaignType,
            campaignGroups: params.campaignGroups,
        };
    }, [
        orders,
        params.campaignGroups,
        params.campaignType,
        params.countries,
        params.search,
    ]);
    const { data: campaigns = [], isLoading } =
        useGetCampaigns(queryOptions).query;

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

    const [isCalendarLoaded, setCalendarLoaded] = useState(false);

    const createPDF = async () => {
        const pdf = new jsPDF('portrait', 'pt', 'a4');
        const data = await html2canvas(document.querySelector('#pdf'));
        const img = data.toDataURL('image/png');
        const imgProperties = pdf.getImageProperties(img);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight =
            (imgProperties.height * pdfWidth) / imgProperties.width;
        pdf.addImage(img, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('polio_calendar.pdf');
    };

    useEffect(() => {
        if (mappedCampaigns.length > 0 && filteredCampaigns) {
            setCalendarLoaded(true);
        }
    }, [isCalendarLoaded, mappedCampaigns.length, filteredCampaigns]);

    return (
        <div>
            {isLogged && (
                <TopBar
                    title={formatMessage(MESSAGES.calendar)}
                    displayBackButton={false}
                />
            )}

            <div id="pdf">
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <Box mb={4}>
                        <Filters disableDates disableOnlyDeleted />
                    </Box>{' '}
                    <Box>
                        {' '}
                        <Button
                            onClick={createPDF}
                            disabled={!isCalendarLoaded}
                            type="button"
                        >
                            Export in pdf
                        </Button>
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
                                loadingCampaigns={isLoading}
                            />
                        </Grid>
                        <Grid item xs={12} lg={4}>
                            <CalendarMap
                                campaigns={filteredCampaigns}
                                loadingCampaigns={isLoading}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </div>
        </div>
    );
};

Calendar.propTypes = {
    params: PropTypes.object.isRequired,
};

export { Calendar };
