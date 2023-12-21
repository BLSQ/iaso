/* eslint-disable camelcase */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeIntl, useSkipEffectOnMount } from 'bluesquare-components';
import { withRouter } from 'react-router';
import { useDispatch } from 'react-redux';
import { Box } from '@mui/material';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { PolioCreateEditDialog as CreateEditDialog } from '../MainDialog/CreateEditDialog';
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
import { genUrl } from '../../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import { DASHBOARD_BASE_URL } from '../../../constants/routes';
import { useSingleTableParams } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/SingleTable';
import { redirectTo } from '../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { useCampaignsTableColumns } from './useCampaignsTableColumns';
import { Filters } from '../../Calendar/campaignCalendar/Filters';
import { DashboardButtons } from './DashboardButtons';

const Dashboard = ({ router }) => {
    const { params } = router;
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();

    const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] =
        useState<boolean>(false);

    const classes: Record<string, string> = useStyles();
    const paramsToUse = useSingleTableParams(params);
    const apiParams: GetCampaignOptions = useCampaignParams(paramsToUse);

    const { data: rawCampaigns, isFetching } = useGetCampaigns(apiParams);
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

    const { mutate: removeCampaign } = useRemoveCampaign();
    const { mutate: restoreCampaign } = useRestoreCampaign();

    // const openEditDialog = useCallback(
    //     (campaignId?: string) => {
    //         setIsCreateEditDialogOpen(true);
    //         const url = genUrl(router, {
    //             campaignId,
    //         });
    //         dispatch(redirectTo(url));
    //     },
    //     [router, dispatch],
    // );

    // const closeCreateEditDialog = () => {
    //     setIsCreateEditDialogOpen(false);
    //     const url = genUrl(router, {
    //         campaignId: undefined,
    //     });
    //     dispatch(redirectTo(url));
    // };

    const handleDeleteConfirmDialogConfirm = id => {
        removeCampaign(id);
    };
    const handleRestoreDialogConfirm = id => {
        restoreCampaign(id);
    };

    // const handleClickEditRow = useCallback(
    //     id => {
    //         openEditDialog(id);
    //     },
    //     [openEditDialog],
    // );

    const handleClickCreateButton = () => {
        setIsCreateEditDialogOpen(true);
    };

    // useEffect(() => {
    //     if (params.campaignId && !isCreateEditDialogOpen) {
    //         openEditDialog(params.campaignId);
    //     }
    // }, [params.campaignId, isCreateEditDialogOpen, openEditDialog]);

    const columns = useCampaignsTableColumns({
        showOnlyDeleted: Boolean(params.showOnlyDeleted),
        // handleClickEditRow,
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
            {/* <CreateEditDialog
                campaignId={params.campaignId}
                isOpen={isCreateEditDialogOpen}
                onClose={closeCreateEditDialog}
            /> */}
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters
                    params={params}
                    baseUrl={DASHBOARD_BASE_URL}
                    showTest
                />
                <DashboardButtons
                    handleClickCreateButton={handleClickCreateButton}
                    exportToCSV={exportToCSV}
                />
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
                        loading: isFetching,
                    }}
                />
            </Box>
        </>
    );
};

const wrappedDashboard = withRouter(Dashboard);
export { wrappedDashboard as Dashboard };
