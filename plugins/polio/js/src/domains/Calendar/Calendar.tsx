/* eslint-disable camelcase */
import React, { useMemo, useEffect, useState, FunctionComponent } from 'react';
import moment from 'moment';
import classnames from 'classnames';
import { Box, Grid, Button, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
    commonStyles,
    useSafeIntl,
    LoadingSpinner,
    ExcellSvg,
    getTableUrl,
} from 'bluesquare-components';
import { useSelector } from 'react-redux';
import domToPdf from 'dom-to-pdf';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { CampaignsCalendar } from './campaignCalendar';
import { getCampaignColor } from '../../constants/campaignsColors';
import { CalendarMap } from './campaignCalendar/map/CalendarMap';
import {
    mapCampaigns,
    filterCampaigns,
    getCalendarData,
} from './campaignCalendar/utils';

import { dateFormat, defaultOrder } from './campaignCalendar/constants';
import { useGetCampaigns } from '../Campaigns/hooks/api/useGetCampaigns';
import MESSAGES from '../../constants/messages';
import { Filters } from './campaignCalendar/Filters';
import { ExportCsvModal } from './ExportCsvModal';
import { userHasPermission } from '../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import {
    User,
    useCurrentUser,
} from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { CalendarParams, MappedCampaign } from './campaignCalendar/types';

type Props = {
    params: CalendarParams;
};
type Users = {
    current: User;
};
type State = {
    users: Users;
};
const pageWidth = 1980;

const useStyles = makeStyles(theme => ({
    containerFullHeightNoTabPadded: {
        ...commonStyles(theme).containerFullHeightNoTabPadded,
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

export const Calendar: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const isLogged = useSelector((state: State) =>
        Boolean(state.users.current),
    );
    const orders = params.order || defaultOrder;
    const queryOptions = useMemo(
        () => ({
            order: orders,
            countries: params.countries,
            search: params.search,
            campaignType: params.campaignType,
            campaignGroups: params.campaignGroups
                ? params.campaignGroups.split(',').map(Number)
                : undefined,
            orgUnitGroups: params.orgUnitGroups
                ? params.orgUnitGroups.split(',').map(Number)
                : undefined,
            fieldset: 'calendar',
        }),
        [
            orders,
            params.campaignGroups,
            params.campaignType,
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
        () => getCalendarData(currentMonday),
        [currentMonday],
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
                            <Filters
                                disableDates
                                disableOnlyDeleted
                                isCalendar
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
