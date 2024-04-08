/* eslint-disable camelcase */
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
    Box,
    Button,
    Grid,
    Theme,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    ExcellSvg,
    LoadingSpinner,
    commonStyles,
    getTableUrl,
    useSafeIntl,
} from 'bluesquare-components';
import classnames from 'classnames';
import domToPdf from 'dom-to-pdf';
import moment from 'moment';
import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { replace } from 'react-router-redux';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { getCampaignColor } from '../../constants/campaignsColors';
import { CampaignsCalendar } from './campaignCalendar';
import { CalendarMap } from './campaignCalendar/map/CalendarMap';
import {
    filterCampaigns,
    getCalendarData,
    mapCampaigns,
} from './campaignCalendar/utils';

import { userHasPermission } from '../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import { genUrl } from '../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import { Router } from '../../../../../../hat/assets/js/apps/Iaso/types/general';
import { useCurrentUser } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import MESSAGES from '../../constants/messages';
import { useGetCampaigns } from '../Campaigns/hooks/api/useGetCampaigns';
import { ExportCsvModal } from './ExportCsvModal';
import { CampaignsFilters } from './campaignCalendar/CampaignsFilters';
import { dateFormat, defaultOrder } from './campaignCalendar/constants';
import {
    CalendarParams,
    MappedCampaign,
    PeriodType,
    ReduxState,
} from './campaignCalendar/types';
import { useGetPeriodTypes } from './hooks/useGetPeriodTypes';

type Props = {
    params: CalendarParams;
    router: Router;
};

const pageWidth = 1980;

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
    exportIcon: { marginRight: '8px' },
}));

export const Calendar: FunctionComponent<Props> = ({ params, router }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const dispatch = useDispatch();
    const isLogged = useSelector((state: ReduxState) =>
        Boolean(state.users.current),
    );
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

    const createPDF = async () => {
        const element = document.getElementById('pdf');
        const options = {
            filename: 'calendar.pdf',
            excludeClassNames: ['createPDF', 'createXlsx', 'createCsv'],
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

    const currentUser = useCurrentUser();
    const periodTypes = useGetPeriodTypes();

    const handleChangePeriodType = (_, value: PeriodType) => {
        const newParams = {
            ...params,
            periodType: value,
        };
        const url = genUrl(router, newParams);
        dispatch(replace(url));
    };
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
                        <Box mb={4}>
                            <CampaignsFilters
                                disableDates
                                disableOnlyDeleted
                                isCalendar
                                router={router}
                            />
                        </Box>
                    )}
                    <Grid
                        container
                        spacing={1}
                        display="flex"
                        justifyContent="flex-end"
                    >
                        <Grid item>
                            <Box mb={2} mt={2}>
                                <Button
                                    onClick={createPDF}
                                    disabled={!isCalendarAndMapLoaded}
                                    type="button"
                                    color="primary"
                                    variant="contained"
                                    className="createPDF"
                                >
                                    <PictureAsPdfIcon
                                        className={classes.exportIcon}
                                    />
                                    {formatMessage(MESSAGES.exportToPdf)}
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item>
                            <Box mb={2} mt={2}>
                                <Button
                                    type="button"
                                    color="primary"
                                    variant="contained"
                                    className="createXlsx"
                                    href={xlsx_url}
                                >
                                    <ExcellSvg className={classes.exportIcon} />
                                    {formatMessage(MESSAGES.exportToExcel)}
                                </Button>
                            </Box>
                        </Grid>
                        {userHasPermission(
                            'iaso_polio_config',
                            currentUser,
                        ) && (
                            <Grid item>
                                <Box mb={2} mt={2}>
                                    {/* @ts-ignore */}
                                    <ExportCsvModal params={params} />
                                </Box>
                            </Grid>
                        )}
                    </Grid>

                    <Grid container spacing={2}>
                        {isPdf && (
                            <Grid item xs={12}>
                                <Typography variant="h3" color="primary">
                                    {formatMessage(MESSAGES.calendarPdfTitle)}
                                </Typography>
                            </Grid>
                        )}
                        <Grid item xs={12} lg={!isPdf ? 8 : 12}>
                            {!isPdf && (
                                <Box
                                    display="flex"
                                    justifyContent="flex-end"
                                    mb={1}
                                >
                                    <ToggleButtonGroup
                                        color="primary"
                                        size="small"
                                        value={params.periodType || 'quarter'}
                                        exclusive
                                        onChange={handleChangePeriodType}
                                    >
                                        {periodTypes.map(period => (
                                            <ToggleButton
                                                key={period.value}
                                                value={period.value}
                                            >
                                                {period.label}
                                            </ToggleButton>
                                        ))}
                                    </ToggleButtonGroup>
                                </Box>
                            )}
                            <CampaignsCalendar
                                params={params}
                                orders={orders}
                                campaigns={filteredCampaigns}
                                calendarData={calendarData}
                                loadingCampaigns={isLoading}
                                isPdf={isPdf}
                                router={router}
                                currentMonday={currentMonday}
                                currentDate={currentDate}
                            />
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
