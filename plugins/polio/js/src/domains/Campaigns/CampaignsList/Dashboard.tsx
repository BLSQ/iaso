/* eslint-disable camelcase */
import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent, useMemo } from 'react';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useSingleTableParams } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/SingleTable';
import { TableWithDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import MESSAGES from '../../../constants/messages';
import { DASHBOARD_BASE_URL } from '../../../constants/routes';
import { useStyles } from '../../../styles/theme';
import { CampaignsFilters } from '../../Calendar/campaignCalendar/CampaignsFilters';
import {
    Options as GetCampaignOptions,
    useCampaignParams,
    useGetCampaigns,
    useGetCampaignsAsCsv,
} from '../hooks/api/useGetCampaigns';
import { useRemoveCampaign } from '../hooks/api/useRemoveCampaign';
import { useRestoreCampaign } from '../hooks/api/useRestoreCampaign';
import { DashboardButtons } from './DashboardButtons';
import { useCampaignsTableColumns } from './useCampaignsTableColumns';
import { useRouter } from '../../../../../../../hat/assets/js/apps/Iaso/routing/useRouter';

export const Dashboard: FunctionComponent = () => {
    const router = useRouter();
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
                <CampaignsFilters router={router} />
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
