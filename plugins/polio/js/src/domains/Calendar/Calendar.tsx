/* eslint-disable camelcase */
import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { Box, Grid, Theme, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    commonStyles,
    getTableUrl,
    useSafeIntl,
} from 'bluesquare-components';
import classnames from 'classnames';
// @ts-ignore
import moment from 'moment';
import { useLocation } from 'react-router-dom';
import { DisplayIfUserHasPerm } from '../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import { XlsxButton } from '../../../../../../hat/assets/js/apps/Iaso/components/Buttons/XslxButton';
import { useParamsObject } from '../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { getCampaignColor } from '../../constants/campaignsColors';
import { CampaignsCalendar } from './campaignCalendar';
import { CalendarMap } from './campaignCalendar/map/CalendarMap';
import {
    filterCampaigns,
    getCalendarData,
    mapCampaigns,
} from './campaignCalendar/utils';

import { useCurrentUser } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import MESSAGES from '../../constants/messages';
import { useGetCampaigns } from '../Campaigns/hooks/api/useGetCampaigns';
import { ExportCsvModal } from './ExportCsvModal';
import { CampaignsFilters } from './campaignCalendar/CampaignsFilters';
import { IsTestLegend } from './campaignCalendar/IsTestLegend';
import { TogglePeriod } from './campaignCalendar/TogglePeriod';
import { dateFormat, defaultOrder } from './campaignCalendar/constants';
import { CalendarParams, MappedCampaign } from './campaignCalendar/types';
import { baseUrls } from '../../constants/urls';
import { POLIO, POLIO_ADMIN } from '../../constants/permissions';
import { PdfExportButton } from './campaignCalendar/PdfExportButton';

const useStyles = makeStyles(theme => ({
    containerFullHeightNoTabPadded: {
        ...commonStyles(theme as Theme).containerFullHeightNoTabPadded,
    },
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

const baseUrl = baseUrls.calendar;
const embeddedCalendarUrl = baseUrls.embeddedCalendar;

export const Calendar: FunctionComponent = () => {
    const location = useLocation();
    const isEmbedded = location.pathname.includes(embeddedCalendarUrl);
    const currentUrl = isEmbedded ? embeddedCalendarUrl : baseUrl;
    const params = useParamsObject(currentUrl) as CalendarParams;

    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const currentUser = useCurrentUser();
    const isLogged = Boolean(currentUser);

    const orders = params.order || defaultOrder;
    const queryOptions = useMemo(
        () => ({
            order: orders,
            countries: params.countries,
            search: params.search,
            campaignType: params.campaignType,
            campaignCategory: params.campaignCategory,
            campaignGroups: params.campaignGroups
                ? params.campaignGroups.split(',').map(Number)
                : undefined,
            orgUnitGroups: params.orgUnitGroups
                ? params.orgUnitGroups.split(',').map(Number)
                : undefined,
            fieldset: 'calendar',
            show_test:
                params.campaignCategory === 'test' ||
                params.campaignCategory === 'all',
        }),
        [
            orders,
            params.campaignGroups,
            params.campaignType,
            params.campaignCategory,
            params.countries,
            params.orgUnitGroups,
            params.search,
        ],
    );

    const {
        data: campaigns = [],
        isLoading,
        isFetching,
    } = useGetCampaigns(queryOptions);

    const currentDate = params.currentDate
        ? moment(params.currentDate, dateFormat)
        : moment();

    const [isCalendarAndMapLoaded, setCalendarAndMapLoaded] = useState(false);
    const [isPdf, setPdf] = useState(false);

    const currentMonday = currentDate.clone().startOf('isoWeek');
    const calendarData = useMemo(
        () => getCalendarData(currentMonday, params.periodType || 'quarter'),
        [currentMonday, params.periodType],
    );

    const mappedCampaigns: MappedCampaign[] = useMemo(
        () => mapCampaigns(campaigns),
        [campaigns],
    );
    const filteredCampaigns = useMemo(
        () =>
            filterCampaigns(
                mappedCampaigns,
                calendarData.firstMonday,
                calendarData.lastSunday,
            ).map((c, index) => ({ ...c, color: getCampaignColor(index) })),
        [mappedCampaigns, calendarData.firstMonday, calendarData.lastSunday],
    );

    const urlParams = {
        currentDate: params.currentDate,
        countries: params.countries,
        campaignType: params.campaignType,
        campaignCategory: params.campaignCategory,
        campaignGroups: params.campaignGroups,
        orgUnitGroups: params.orgUnitGroups,
        search: params.search,
        order: params.order,
    };

    const xlsx_url = getTableUrl(
        'polio/campaigns/create_calendar_xlsx_sheet',
        urlParams,
    );

    useEffect(() => {
        if (
            filteredCampaigns.length > 0 &&
            mappedCampaigns.length > 0 &&
            !isLoading
        ) {
            setCalendarAndMapLoaded(true);
        } else {
            setCalendarAndMapLoaded(false);
        }
    }, [filteredCampaigns, mappedCampaigns, isLoading]);

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
                        !isPdf && classes.isNotPdf,
                        isPdf && classes.isPdf,
                    )}
                >
                    {!isPdf && (
                        <>
                            <Box mb={4}>
                                <CampaignsFilters
                                    disableDates
                                    disableOnlyDeleted
                                    isCalendar
                                    params={params}
                                />
                            </Box>
                            <Grid
                                container
                                spacing={1}
                                display="flex"
                                justifyContent="flex-end"
                            >
                                <Grid item>
                                    <Box mb={2} mt={2}>
                                        <PdfExportButton
                                            setPdf={setPdf}
                                            disabled={!isCalendarAndMapLoaded}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item>
                                    <Box mb={2} mt={2}>
                                        <XlsxButton xlsxUrl={xlsx_url}>
                                            {formatMessage(
                                                MESSAGES.exportToExcel,
                                            )}
                                        </XlsxButton>
                                    </Box>
                                </Grid>
                                <DisplayIfUserHasPerm
                                    permissions={[POLIO, POLIO_ADMIN]}
                                >
                                    <Grid item>
                                        <Box mb={2} mt={2}>
                                            <ExportCsvModal
                                                params={params}
                                                iconProps={{}}
                                            />
                                        </Box>
                                    </Grid>
                                </DisplayIfUserHasPerm>
                            </Grid>
                        </>
                    )}

                    <Grid container spacing={2}>
                        {isPdf && (
                            <Grid item xs={12}>
                                <Typography variant="h3" color="primary">
                                    {formatMessage(MESSAGES.calendarPdfTitle)}
                                </Typography>
                            </Grid>
                        )}
                        <Grid item xs={12} lg={!isPdf ? 8 : 12}>
                            <Box display="flex" justifyContent="flex-end">
                                {(params.campaignCategory === 'test' ||
                                    params.campaignCategory === 'all') && (
                                    <Box mr={2}>
                                        <IsTestLegend />
                                    </Box>
                                )}
                                {!isPdf && (
                                    <TogglePeriod
                                        params={params}
                                        url={currentUrl}
                                    />
                                )}
                            </Box>
                            <Box mt={!isPdf ? 1 : 0}>
                                <CampaignsCalendar
                                    params={params}
                                    orders={orders}
                                    campaigns={filteredCampaigns}
                                    calendarData={calendarData}
                                    loadingCampaigns={isLoading}
                                    isPdf={isPdf}
                                    url={currentUrl}
                                    isLogged={isLogged}
                                    currentMonday={currentMonday}
                                    currentDate={currentDate}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} lg={!isPdf ? 4 : 12}>
                            <CalendarMap
                                campaigns={filteredCampaigns}
                                loadingCampaigns={isFetching}
                                isPdf={isPdf}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </div>
        </div>
    );
};
