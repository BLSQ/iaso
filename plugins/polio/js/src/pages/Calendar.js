import React, { useMemo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import classnames from 'classnames';
import { Box, makeStyles, Grid, Button } from '@material-ui/core';
import PictureAsPdfIcon from '@material-ui/icons/PictureAsPdf';
import {
    commonStyles,
    useSafeIntl,
    LoadingSpinner,
} from 'bluesquare-components';
import { useSelector } from 'react-redux';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import domToPdf from 'dom-to-pdf';
import { CampaignsCalendar } from '../components/campaignCalendar';
import { getCampaignColor } from '../constants/campaignsColors';
import { CalendarMap } from '../components/campaignCalendar/map/CalendarMap';
import {
    mapCampaigns,
    filterCampaigns,
    getCalendarData,
} from '../components/campaignCalendar/utils';

import { useGetMergedCampaignShapes } from '../hooks/useGetMergedCampaignShapes.ts';

import {
    dateFormat,
    defaultOrder,
} from '../components/campaignCalendar/constants';
import { useGetCampaigns } from '../hooks/useGetCampaigns';
// @ts-ignore
import MESSAGES from '../constants/messages';
import { Filters } from '../components/campaignCalendar/Filters';

const pageWidth = 1980;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    loadingSpinnerPdf: {
        backgroundColor: 'rgba(255,255,255,1)',
        zIndex: 2000,
    },
    isPdf: {
        height: 'auto',
    },
    isNotPdf: {
        height: 'calc(100vh - 65px)',
    },
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

    const [isCalendarAndMapLoaded, setCalendarAndMapLoaded] = useState(false);
    const [isPdf, setPdf] = useState(false);

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

    const { data: mergedShapes } = useGetMergedCampaignShapes().query;

    const createPDF = async () => {
        const element = document.getElementById('pdf');
        const options = {
            filename: 'calendar.pdf',
            excludeTagNames: 'button',
            overrideWidth: pageWidth,
        };

        await setPdf(true);

        document.body.style.width = `${pageWidth}px`;
        window.dispatchEvent(new Event('resize'));
        setTimeout(() => {
            domToPdf(element, options, async () => {
                await setPdf(false);
                document.body.style.width = 'auto';
                window.dispatchEvent(new Event('resize'));
            });
        }, 1000);
    };

    useEffect(() => {
        if (mergedShapes !== undefined && filteredCampaigns) {
            setCalendarAndMapLoaded(true);
        }
    }, [mergedShapes, filteredCampaigns]);

    return (
        <div>
            {isLogged && !isPdf && (
                <TopBar
                    title={formatMessage(MESSAGES.calendar)}
                    displayBackButton={false}
                />
            )}
            {isPdf && (
                <LoadingSpinner
                    absolute
                    classes={{
                        rootAbsolute: classes.loadingSpinnerPdf,
                    }}
                />
            )}

            <div id="pdf">
                <Box
                    className={classnames(
                        classes.containerFullHeightNoTabPadded,
                        isPdf && classes.isPdf,
                        !isPdf && classes.isNotPdf,
                    )}
                >
                    {!isPdf && (
                        <Box mb={4}>
                            <Filters disableDates disableOnlyDeleted />
                        </Box>
                    )}
                    <Box mb={2} mt={2} display="flex" justifyContent="flex-end">
                        <Button
                            onClick={createPDF}
                            disabled={!isCalendarAndMapLoaded}
                            type="button"
                            color="primary"
                            variant="contained"
                        >
                            <PictureAsPdfIcon style={{ marginRight: '8px' }} />
                            {formatMessage(MESSAGES.exportToPdf)}
                        </Button>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12} lg={!isPdf ? 8 : 12}>
                            <CampaignsCalendar
                                currentDate={currentDate}
                                params={params}
                                orders={orders}
                                campaigns={filteredCampaigns}
                                calendarData={calendarData}
                                currentMonday={currentMonday}
                                loadingCampaigns={isLoading}
                                isPdf={isPdf}
                            />
                        </Grid>
                        <Grid item xs={12} lg={!isPdf ? 4 : 12}>
                            <CalendarMap
                                campaigns={filteredCampaigns}
                                loadingCampaigns={isLoading}
                                isPdf={isPdf}
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
