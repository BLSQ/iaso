import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { Box, Grid, Theme, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    commonStyles,
    getTableUrl,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import classnames from 'classnames';
// @ts-ignore
import moment from 'moment';
import { useLocation } from 'react-router-dom';
import { XlsxButton } from '../../../../../../hat/assets/js/apps/Iaso/components/Buttons/XslxButton';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useParamsObject } from '../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { useCurrentUser } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { getCampaignColor } from '../../constants/campaignsColors';

import MESSAGES from '../../constants/messages';
import { baseUrls } from '../../constants/urls';
import {
    CAMPAIGNS_ENDPOINT,
    useGetCampaigns,
} from '../Campaigns/hooks/api/useGetCampaigns';
import { CampaignsCalendar } from './campaignCalendar';
import {
    CampaignsFilters,
    getRedirectUrl,
} from './campaignCalendar/CampaignsFilters';
import { dateFormat, defaultOrder } from './campaignCalendar/constants';
import { HasSubActivityLegend } from './campaignCalendar/HasSubActivityLegend';
import { IsOnHoldLegend } from './campaignCalendar/IsOnHoldLegend';
import { CalendarMap } from './campaignCalendar/map/CalendarMap';
import { PdfExportButton } from './campaignCalendar/PdfExportButton';
import { TogglePeriod } from './campaignCalendar/TogglePeriod';
import { CalendarParams, MappedCampaign } from './campaignCalendar/types';
import {
    filterCampaigns,
    getCalendarData,
    mapCampaigns,
} from './campaignCalendar/utils/campaigns';
import { ExportCsvModal } from './ExportCsvModal';

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
    const [campaignType, setCampaignType] = useState(params.campaignType);
    const [isTypeSet, setIsTypeSet] = useState(!!params.campaignType);

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
            show_test: false,
            on_hold: true,
        }),
        [
            orders,
            params.countries,
            params.search,
            params.campaignCategory,
            params.campaignGroups,
            params.orgUnitGroups,
            params.campaignType,
        ],
    );

    const {
        data: campaigns = [],
        isLoading,
        isFetching,
    } = useGetCampaigns(
        queryOptions,
        CAMPAIGNS_ENDPOINT,
        ['calendar-campaigns'],
        { enabled: isTypeSet },
    );

    const redirectToReplace = useRedirectToReplace();
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
        () =>
            mapCampaigns(
                campaigns,
                calendarData.firstMonday,
                calendarData.lastSunday,
            ),
        [campaigns, calendarData.firstMonday, calendarData.lastSunday],
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

    const redirectUrl = getRedirectUrl(true, isEmbedded);
    useEffect(() => {
        if (!params.campaignType && !isTypeSet) {
            setCampaignType('polio');
            setIsTypeSet(true);
            redirectToReplace(redirectUrl, {
                ...params,
                campaignType: 'polio',
            });
        }
        // only test once to force polio as type
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                                    isEmbedded={isEmbedded}
                                    params={params}
                                    setCampaignType={setCampaignType}
                                    campaignType={campaignType}
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
                                <Grid item>
                                    <Box mb={2} mt={2}>
                                        <ExportCsvModal
                                            params={params}
                                            iconProps={{}}
                                        />
                                    </Box>
                                </Grid>
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
                                <Box mr={2}>
                                    <IsOnHoldLegend />
                                </Box>
                                <Box mr={2}>
                                    <HasSubActivityLegend />
                                </Box>
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
                                    loadingCampaigns={isFetching}
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
