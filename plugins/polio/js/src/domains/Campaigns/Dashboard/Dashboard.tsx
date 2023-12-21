/* eslint-disable camelcase */
import React, { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { withRouter } from 'react-router';
import { Box } from '@mui/material';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import {
    useGetCampaigns,
    useCampaignParams,
    useGetCampaignsAsCsv,
    Options as GetCampaignOptions,
} from '../hooks/api/useGetCampaigns';
import { useRemoveCampaign } from '../hooks/api/useRemoveCampaign';
import { useRestoreCampaign } from '../hooks/api/useRestoreCampaign';
import { useStyles } from '../../../styles/theme';
import MESSAGES from '../../../constants/messages';
import { DASHBOARD_BASE_URL } from '../../../constants/routes';
import { useSingleTableParams } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/SingleTable';
import { useCampaignsTableColumns } from './useCampaignsTableColumns';
import { Filters } from '../../Calendar/campaignCalendar/Filters';
import { DashboardButtons } from './DashboardButtons';

const Dashboard = ({ router }) => {
    const { params } = router;
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const paramsToUse = useSingleTableParams(params);
    const apiParams: GetCampaignOptions = useCampaignParams(paramsToUse);

    const { data: rawCampaigns, isFetching } = useGetCampaigns(
        apiParams,
        undefined,
        undefined,
        { keepPreviousData: true },
    );
    const exportToCSV = useGetCampaignsAsCsv(apiParams);

    const campaigns = useMemo(() => {
        if (!rawCampaigns) return rawCampaigns;
        return {
            ...rawCampaigns,
            campaigns: rawCampaigns.campaigns.map(campaign => ({
                ...campaign,
                grouped_campaigns:
                    campaign.grouped_campaigns.length > 0
                        ? campaign.grouped_campaigns
                        : null,
            })),
        };
    }, [rawCampaigns]);

    // Leaving the API code for delete and restore here, so we cxan use isLoading for the table
    const { mutate: removeCampaign, isLoading: isDeleting } =
        useRemoveCampaign();
    const { mutate: restoreCampaign, isLoading: isRestoring } =
        useRestoreCampaign();

    const handleDeleteConfirmDialogConfirm = id => {
        removeCampaign(id);
    };
    const handleRestoreDialogConfirm = id => {
        restoreCampaign(id);
    };

    const columns = useCampaignsTableColumns({
        showOnlyDeleted: Boolean(params.showOnlyDeleted),
        handleClickDeleteRow: handleDeleteConfirmDialogConfirm,
        handleClickRestoreRow: handleRestoreDialogConfirm,
        router,
    });

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.campaigns)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters
                    params={params}
                    baseUrl={DASHBOARD_BASE_URL}
                    showTest
                />
                <Box mb={2}>
                    <DashboardButtons
                        router={router}
                        exportToCSV={exportToCSV}
                    />
                </Box>
                {/* @ts-ignore */}
                <TableWithDeepLink
                    data={campaigns?.campaigns ?? []}
                    count={campaigns?.count}
                    pages={campaigns?.pages}
                    params={apiParams}
                    // type of `accessor` should be changed to accept a FunctionComponent
                    // @ts-ignore
                    columns={columns}
                    baseUrl={DASHBOARD_BASE_URL}
                    marginTop={false}
                    extraProps={{
                        loading: isFetching || isDeleting || isRestoring,
                    }}
                />
            </Box>
        </>
    );
};

const wrappedDashboard = withRouter(Dashboard);
export { wrappedDashboard as Dashboard };
