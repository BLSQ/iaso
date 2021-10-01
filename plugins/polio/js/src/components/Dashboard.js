/* eslint-disable camelcase */
import React, { useCallback, useMemo, useState } from 'react';
import {
    Table,
    LoadingSpinner,
    IconButton as IconButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import { Box } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DownloadIcon from '@material-ui/icons/GetApp';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { useDebounce } from 'use-debounce';
import { PolioCreateEditDialog as CreateEditDialog } from './CreateEditDialog';
import { PageAction } from './Buttons/PageAction';
import { PageActions } from './Buttons/PageActions';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

import { useGetCampaigns } from '../hooks/useGetCampaigns';
import { useRemoveCampaign } from '../hooks/useRemoveCampaign';
import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';

import TopBar from '../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import ImportLineListDialog from './ImportLineListDialog';

const DEFAULT_PAGE_SIZE = 40;
const DEFAULT_PAGE = 1;
const DEFAULT_ORDER = '-cvdpv2_notified_at';

export const Dashboard = () => {
    const { formatMessage } = useSafeIntl();
    const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] =
        useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState();
    const [page, setPage] = useState(parseInt(DEFAULT_PAGE, 10));
    const [pageSize, setPageSize] = useState(parseInt(DEFAULT_PAGE_SIZE, 10));
    const [searchQueryText, setSearchQuery] = useState(undefined);
    const [searchQuery] = useDebounce(searchQueryText, 500);
    const [order, setOrder] = useState(DEFAULT_ORDER);
    const classes = useStyles();

    const { query, exportToCSV } = useGetCampaigns({
        page,
        pageSize,
        order,
        searchQuery,
    });

    const { data: campaigns = [], status } = query;

    const { mutate: removeCampaign } = useRemoveCampaign();

    const selectedCampaign = campaigns?.campaigns?.find(
        campaign => campaign.id === selectedCampaignId,
    );

    const openCreateEditDialog = useCallback(() => {
        setIsCreateEditDialogOpen(true);
    }, [setIsCreateEditDialogOpen]);

    const closeCreateEditDialog = () => {
        setSelectedCampaignId(undefined);
        setIsCreateEditDialogOpen(false);
    };

    const openDeleteConfirmDialog = useCallback(() => {
        setIsConfirmDeleteDialogOpen(true);
    }, [setIsConfirmDeleteDialogOpen]);

    const closeDeleteConfirmDialog = () => {
        setIsConfirmDeleteDialogOpen(false);
    };

    const handleDeleteConfirmDialogConfirm = () => {
        removeCampaign(selectedCampaign.id, {
            onSuccess: () => {
                closeDeleteConfirmDialog();
            },
        });
    };

    const handleClickEditRow = useCallback(
        id => {
            setSelectedCampaignId(id);
            openCreateEditDialog();
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

    const handleClickCreateButton = () => {
        setSelectedCampaignId(undefined);
        openCreateEditDialog();
    };

    const handleSearch = useCallback(event => {
        setSearchQuery(event.target.value);
    }, []);

    const columns = useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.country),
                accessor: 'top_level_org_unit_name',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.name),
                accessor: 'obr_name',
            },
            {
                Header: formatMessage(MESSAGES.cvdpv2NotificationDate),
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
                accessor: 'general_status',
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'id',
                sortable: false,
                Cell: settings => (
                    <>
                        <IconButtonComponent
                            icon="edit"
                            tooltipMessage={MESSAGES.edit}
                            onClick={() => handleClickEditRow(settings.value)}
                        />
                        <IconButtonComponent
                            icon="delete"
                            tooltipMessage={MESSAGES.delete}
                            onClick={() => handleClickDeleteRow(settings.value)}
                        />
                    </>
                ),
            },
        ],
        [handleClickDeleteRow, handleClickEditRow, formatMessage],
    );

    // The naming is aligned with the names in Table
    const onTableParamsChange = useCallback(
        (_baseUrl, newParams) => {
            if (newParams.page !== page) {
                setPage(newParams.page);
            }
            if (newParams.pageSize !== pageSize) {
                setPageSize(newParams.pageSize);
            }
            if (newParams.order !== order) {
                setOrder(newParams.order);
            }
        },
        [page, pageSize, order],
    );

    const tableParams = useMemo(() => {
        return {
            pageSize,
            page,
            order,
        };
    }, [pageSize, page, order]);
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
            <DeleteConfirmDialog
                isOpen={isConfirmDeleteDialogOpen}
                onClose={closeDeleteConfirmDialog}
                onConfirm={handleDeleteConfirmDialogConfirm}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                {status === 'loading' && <LoadingSpinner />}
                <PageActions onSearch={handleSearch}>
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
                {status === 'success' && (
                    <Table
                        params={tableParams}
                        count={campaigns.count}
                        pages={Math.ceil(campaigns.count / pageSize)}
                        baseUrl="/polio"
                        redirectTo={onTableParamsChange}
                        columns={columns}
                        data={campaigns.campaigns}
                    />
                )}
            </Box>
        </>
    );
};
