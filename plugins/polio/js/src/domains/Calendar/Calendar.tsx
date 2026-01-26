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
import moment from 'moment';
import { useLocation } from 'react-router-dom';
import { XlsxButton } from '../../../../../../hat/assets/js/apps/Iaso/components/Buttons/XslxButton';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useParamsObject } from '../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { useCurrentUser } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import MESSAGES from '../../constants/messages';
import { baseUrls } from '../../constants/urls';
import { CampaignsCalendar } from './campaignCalendar';
import {
    CampaignsFilters,
    getRedirectUrl,
} from './campaignCalendar/CampaignsFilters';
import { dateFormat, defaultOrder } from './campaignCalendar/constants';
import { HasSubActivityLegend } from './campaignCalendar/HasSubActivityLegend';
import { IntegratedCampaignsLegend } from './campaignCalendar/IntegratedCampaignsLegend';
import { IsOnHoldLegend } from './campaignCalendar/IsOnHoldLegend';
import { CalendarMap } from './campaignCalendar/map/CalendarMap';
import { PdfExportButton } from './campaignCalendar/PdfExportButton';
import { TogglePeriod } from './campaignCalendar/TogglePeriod';
import { CalendarParams } from './campaignCalendar/types';
import { getCalendarData } from './campaignCalendar/utils/campaigns';
import { ExportCsvModal } from './ExportCsvModal';
import { useGetFormattedCalendarData } from './hooks/useGetFormattedCalendarData';
import { CalendarOrdering } from './hooks/useMergedCampaigns/useMergedCampaigns';

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

    const currentDate = params.currentDate
        ? moment(params.currentDate, dateFormat)
        : moment();

    const redirectToReplace = useRedirectToReplace();

    const [isCalendarAndMapLoaded, setCalendarAndMapLoaded] = useState(false);
    const [isPdf, setPdf] = useState(false);

    const currentMonday = currentDate.clone().startOf('isoWeek');
    const calendarData = useMemo(
        () => getCalendarData(currentMonday, params.periodType || 'quarter'),
        [currentMonday, params.periodType],
    );
    const { filteredCampaigns, isFetching, isLoading } =
        useGetFormattedCalendarData({
            params,
            isTypeSet,
            order: params.order,
            calendarData,
            isEmbedded,
            currentDate,
            campaignType: params.campaignType,
        });
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
        if (filteredCampaigns.length > 0 && !isLoading) {
            setCalendarAndMapLoaded(true);
        } else {
            setCalendarAndMapLoaded(false);
        }
    }, [filteredCampaigns, isLoading]);

    const redirectUrl = getRedirectUrl(true, isEmbedded);
    useEffect(() => {
        const shouldSetCampaignType = !params.campaignType && !isTypeSet;
        const shouldSetOrder = !params.order;
        const enforcedDefaults: Record<string, string> = { ...params };

        if (shouldSetCampaignType) {
            setCampaignType('polio');
            setIsTypeSet(true);
            enforcedDefaults.campaignType = 'polio';
        }
        if (shouldSetOrder) {
            enforcedDefaults.order = defaultOrder;
        }
        if (shouldSetCampaignType || shouldSetOrder) {
            redirectToReplace(redirectUrl, enforcedDefaults);
        }
        // only test once to force polio as type and default order
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
                                    <IntegratedCampaignsLegend />
                                </Box>
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
                                    orders={params.order as CalendarOrdering}
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
