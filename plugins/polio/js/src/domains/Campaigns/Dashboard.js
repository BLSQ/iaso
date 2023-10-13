/* eslint-disable camelcase */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import {
    IconButton as IconButtonComponent,
    useSafeIntl,
    useSkipEffectOnMount,
} from 'bluesquare-components';
import { withRouter } from 'react-router';
import { useDispatch } from 'react-redux';
import { push } from 'react-router-redux';
import { Box, Tooltip } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DownloadIcon from '@material-ui/icons/GetApp';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink.tsx';
import { PolioCreateEditDialog as CreateEditDialog } from './MainDialog/CreateEditDialog';
import { PageAction } from '../../components/Buttons/PageAction';
import { PageActions } from '../../components/Buttons/PageActions';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
    useGetCampaigns,
    useCampaignParams,
    useGetCampaignsAsCsv,
} from './hooks/api/useGetCampaigns.ts';
import { useRemoveCampaign } from './hooks/api/useRemoveCampaign';
import { useRestoreCampaign } from './hooks/api/useRestoreCampaign';
import { useStyles } from '../../styles/theme';
import MESSAGES from '../../constants/messages';
import { genUrl } from '../../../../../../hat/assets/js/apps/Iaso/routing/routing.ts';
import { convertObjectToString } from '../../utils';
import { DASHBOARD_BASE_URL } from '../../constants/routes';
import { useSingleTableParams } from '../../../../../../hat/assets/js/apps/Iaso/components/tables/SingleTable';
import { PageActionWithLink } from '../../components/Buttons/PageActionWithLink.tsx';
import { ImportLine } from './ImportLine/ImportLine.tsx';

const Dashboard = ({ router }) => {
    const { params } = router;
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();

    const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] =
        useState(false);
    const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState();
    const classes = useStyles();

    const paramsToUse = useSingleTableParams(params);
    const apiParams = useCampaignParams(paramsToUse);

    const [resetPageToOne, setResetPageToOne] = useState('');

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

    const selectedCampaign = campaigns?.campaigns?.find(
        campaign => campaign.id === selectedCampaignId,
    );

    const openCreateEditDialog = useCallback(
        campaignId => {
            setIsCreateEditDialogOpen(true);
            const url = genUrl(router, {
                campaignId,
            });
            dispatch(push(url));
        },
        [setIsCreateEditDialogOpen, router, dispatch],
    );

    const closeCreateEditDialog = () => {
        setSelectedCampaignId(undefined);
        setIsCreateEditDialogOpen(false);
        const url = genUrl(router, {
            campaignId: undefined,
        });
        dispatch(push(url));
    };

    const openDeleteConfirmDialog = useCallback(() => {
        setIsConfirmDeleteDialogOpen(true);
    }, [setIsConfirmDeleteDialogOpen]);

    const closeDeleteConfirmDialog = () => {
        setIsConfirmDeleteDialogOpen(false);
    };
    const closeRestoreConfirmDialog = () => {
        setIsRestoreDialogOpen(false);
    };

    const handleDeleteConfirmDialogConfirm = () => {
        removeCampaign(selectedCampaign.id, {
            onSuccess: () => {
                closeDeleteConfirmDialog();
            },
        });
    };
    const handleRestoreDialogConfirm = () => {
        restoreCampaign(selectedCampaign.id, {
            onSuccess: () => {
                closeRestoreConfirmDialog();
            },
        });
    };

    const handleClickEditRow = useCallback(
        id => {
            setSelectedCampaignId(id);
            openCreateEditDialog(id);
        },
        [setSelectedCampaignId, openCreateEditDialog],
    );

    const handleClickDeleteRow = useCallback(
        id => {
            setSelectedCampaignId(id);
            openDeleteConfirmDialog();
        },
        [setSelectedCampaignId, openDeleteConfirmDialog],
    );
    const handleClickRestoreRow = useCallback(
        id => {
            setSelectedCampaignId(id);
            setIsRestoreDialogOpen(true);
        },
        [setSelectedCampaignId, setIsRestoreDialogOpen],
    );

    const handleClickCreateButton = () => {
        setSelectedCampaignId(undefined);
        openCreateEditDialog();
    };

    useEffect(() => {
        if (params.campaignId) {
            setSelectedCampaignId(params.campaignId);
            openCreateEditDialog(params.campaignId);
        }
    }, []);

    useSkipEffectOnMount(() => {
        const newParams = {
            ...apiParams,
        };
        delete newParams.page;
        delete newParams.order;
        setResetPageToOne(convertObjectToString(newParams));
    }, [
        apiParams.pageSize,
        apiParams.countries,
        apiParams.search,
        apiParams.roundStartFrom,
        apiParams.roundStartTo,
    ]);
    const columns = useMemo(() => {
        const cols = [
            {
                Header: formatMessage(MESSAGES.country),
                id: 'country__name',
                accessor: 'top_level_org_unit_name',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.obrName),
                accessor: 'obr_name',
            },
            {
                Header: formatMessage(MESSAGES.virusNotificationDate),
                accessor: 'cvdpv2_notified_at',
            },
            {
                Header: formatMessage(MESSAGES.lastRound),
                id: `last_round_started_at`,
                accessor: row => {
                    const allRounds = (
                        <>
                            {row.rounds.map(r => (
                                <li key={`${r.number}-${r.started_at}`}>
                                    {`${r.number}. ${r.started_at} -> ${r.ended_at}`}
                                    <br />
                                </li>
                            ))}
                        </>
                    );
                    return (
                        <Tooltip title={allRounds}>
                            <span>
                                {row.rounds &&
                                    row.rounds[row.rounds.length - 1]
                                        ?.started_at}
                            </span>
                        </Tooltip>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.status),
                sortable: false,
                accessor: row => row.general_status,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'id',
                sortable: false,
                Cell: settings => (
                    <>
                        {!params.showOnlyDeleted && (
                            <>
                                <IconButtonComponent
                                    icon="edit"
                                    tooltipMessage={MESSAGES.edit}
                                    onClick={() =>
                                        handleClickEditRow(settings.value)
                                    }
                                />
                                <IconButtonComponent
                                    icon="delete"
                                    tooltipMessage={MESSAGES.delete}
                                    onClick={() =>
                                        handleClickDeleteRow(settings.value)
                                    }
                                />
                            </>
                        )}
                        {params.showOnlyDeleted && (
                            <IconButtonComponent
                                icon="restore-from-trash"
                                tooltipMessage={MESSAGES.restoreCampaign}
                                onClick={() =>
                                    handleClickRestoreRow(settings.value)
                                }
                            />
                        )}
                    </>
                ),
            },
        ];
        if (params.showOnlyDeleted) {
            cols.unshift({
                Header: formatMessage(MESSAGES.deleted_at),
                accessor: 'deleted_at',
                Cell: settings =>
                    moment(settings.row.original.deleted_at).format('LTS'),
            });
        }
        return cols;
    }, [
        handleClickDeleteRow,
        handleClickEditRow,
        formatMessage,
        params.showOnlyDeleted,
    ]);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.campaigns)}
                displayBackButton={false}
            />
            <CreateEditDialog
                campaignId={selectedCampaign?.id}
                isOpen={isCreateEditDialogOpen}
                onClose={closeCreateEditDialog}
            />
            <ConfirmDialog
                title={formatMessage(MESSAGES.deleteWarning)}
                isOpen={isConfirmDeleteDialogOpen}
                onClose={closeDeleteConfirmDialog}
                onConfirm={handleDeleteConfirmDialogConfirm}
            />
            <ConfirmDialog
                title={formatMessage(MESSAGES.restoreWarning)}
                isOpen={isRestoreDialogOpen}
                onClose={closeRestoreConfirmDialog}
                onConfirm={handleRestoreDialogConfirm}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <PageActions params={params}>
                    <PageAction
                        icon={AddIcon}
                        onClick={handleClickCreateButton}
                    >
                        {formatMessage(MESSAGES.create)}
                    </PageAction>
                    <PageActionWithLink icon={DownloadIcon} url={exportToCSV}>
                        {formatMessage(MESSAGES.csv)}
                    </PageActionWithLink>
                    <ImportLine />
                </PageActions>
                <TableWithDeepLink
                    data={campaigns?.campaigns ?? []}
                    count={campaigns?.count}
                    pages={campaigns?.pages}
                    params={apiParams}
                    columns={columns}
                    baseUrl={DASHBOARD_BASE_URL}
                    marginTop={false}
                    extraProps={{
                        loading: isFetching,
                    }}
                    resetPageToOne={resetPageToOne}
                />
            </Box>
        </>
    );
};

Dashboard.propTypes = {
    router: PropTypes.object.isRequired,
};

const wrappedDashboard = withRouter(Dashboard);
export { wrappedDashboard as Dashboard };
