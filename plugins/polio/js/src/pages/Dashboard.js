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
import { Box } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DownloadIcon from '@material-ui/icons/GetApp';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { getApiParamDateString } from 'Iaso/utils/dates.ts';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { PolioCreateEditDialog as CreateEditDialog } from '../components/CreateEditDialog';
import { PageAction } from '../components/Buttons/PageAction';
import { PageActions } from '../components/Buttons/PageActions';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useGetCampaigns } from '../hooks/useGetCampaigns';
import { useRemoveCampaign } from '../hooks/useRemoveCampaign';
import { useRestoreCampaign } from '../hooks/useRestoreCampaign';
import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';

import ImportLineListDialog from '../components/ImportLineListDialog';
import { genUrl } from '../utils/routing';
import { convertObjectToString } from '../utils';
import { DASHBOARD_BASE_URL } from '../constants/routes';

const DEFAULT_PAGE_SIZE = 40;
const DEFAULT_PAGE = 1;
const DEFAULT_ORDER = '-cvdpv2_notified_at';

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

    // Add the defaults. put in a memo for comparison.
    // Need a better way to handle default in the routing
    const apiParams = useMemo(() => {
        return {
            order: params?.order ?? DEFAULT_ORDER,
            pageSize: params?.pageSize ?? DEFAULT_PAGE_SIZE,
            page: params?.page ?? DEFAULT_PAGE,
            countries: params.countries,
            search: params.search,
            r1StartFrom: getApiParamDateString(params.r1StartFrom),
            r1StartTo: getApiParamDateString(params.r1StartTo),
            showOnlyDeleted: params.showOnlyDeleted,
            campaignType: params.campaignType,
        };
    }, [params]);

    const [resetPageToOne, setResetPageToOne] = useState('');

    const { query, exportToCSV } = useGetCampaigns(apiParams);

    const { data: campaigns, isFetching } = query;

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
        apiParams.r1StartFrom,
        apiParams.r1StartTo,
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
                Header: formatMessage(MESSAGES.name),
                accessor: 'obr_name',
            },
            {
                Header: formatMessage(MESSAGES.virusNotificationDate),
                accessor: 'cvdpv2_notified_at',
            },
            {
                Header: formatMessage(MESSAGES.roundOne),
                id: 'round_one__started_at',
                accessor: row => row.round_one?.started_at,
            },
            {
                Header: formatMessage(MESSAGES.roundTwo),
                id: 'round_two__started_at',
                accessor: row => row.round_two?.started_at,
            },
            {
                Header: formatMessage(MESSAGES.status),
                sortable: false,
                accessor: row => formatMessage(MESSAGES[row.general_status]),
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
                selectedCampaign={selectedCampaign}
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
                    <PageAction icon={DownloadIcon} onClick={exportToCSV}>
                        {formatMessage(MESSAGES.csv)}
                    </PageAction>
                    <ImportLineListDialog
                        renderTrigger={({ openDialog }) => (
                            <PageAction
                                icon={CloudUploadIcon}
                                onClick={openDialog}
                            >
                                {formatMessage(MESSAGES.import)}
                            </PageAction>
                        )}
                    />
                </PageActions>
                <TableWithDeepLink
                    data={campaigns?.campaigns ?? []}
                    count={campaigns?.count}
                    pages={campaigns?.pages}
                    params={params}
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
