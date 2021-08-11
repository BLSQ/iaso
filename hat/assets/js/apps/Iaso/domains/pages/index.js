import React, { useCallback, useMemo, useState } from 'react';
import {
    Table,
    LoadingSpinner,
    useSafeIntl,
    commonStyles,
    IconButton as IconButtonComponent,
    ColumnText,
} from 'bluesquare-components';
import { makeStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import moment from 'moment';
import AddIcon from '@material-ui/icons/Add';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { useGetPages } from './hooks/useGetPages';
import { useRemovePage } from './hooks/useRemovePage';

import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import CreateEditDialog from './components/CreateEditDialog';
import PageActions from './components/PageActions';
import PageAction from './components/PageAction';
import { PAGES_TYPES } from './constants';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Pages = () => {
    const intl = useSafeIntl();
    const classes = useStyles();
    const [page, setPage] = useState(parseInt(DEFAULT_PAGE, 10));
    const [pageSize, setPageSize] = useState(parseInt(DEFAULT_PAGE_SIZE, 10));
    const [selectedPageSlug, setSelectedPageSlug] = useState();
    const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] =
        useState(false);

    const openCreateEditDialog = useCallback(() => {
        setIsCreateEditDialogOpen(true);
    }, [setIsCreateEditDialogOpen]);

    const handleClickCreateButton = () => {
        setSelectedPageSlug(undefined);
        openCreateEditDialog();
    };

    const handleClickEditRow = useCallback(
        slug => {
            setSelectedPageSlug(slug);
            openCreateEditDialog();
        },
        [setSelectedPageSlug, openCreateEditDialog],
    );

    const closeCreateEditDialog = () => {
        setSelectedPageSlug(undefined);
        setIsCreateEditDialogOpen(false);
    };

    const closeDeleteConfirmDialog = () => {
        setIsConfirmDeleteDialogOpen(false);
    };

    const { mutate: removePage } = useRemovePage();

    const openDeleteConfirmDialog = useCallback(() => {
        setIsConfirmDeleteDialogOpen(true);
    }, [setIsConfirmDeleteDialogOpen]);

    const handleClickDeleteRow = useCallback(
        slug => {
            setSelectedPageSlug(slug);
            openDeleteConfirmDialog();
        },
        [setSelectedPageSlug, openDeleteConfirmDialog],
    );

    const { query } = useGetPages({
        page,
        pageSize,
    });

    const { data: pages = [], status } = query;

    const selectedPage = pages?.results?.find(
        result => result.slug === selectedPageSlug,
    );

    const handleDeleteConfirmDialogConfirm = () => {
        removePage(selectedPage?.slug, {
            onSuccess: () => {
                closeDeleteConfirmDialog();
            },
        });
    };

    const columns = useMemo(
        () => [
            {
                Header: intl.formatMessage(MESSAGES.name),
                accessor: 'name',
                sortable: false,
            },
            {
                Header: intl.formatMessage(MESSAGES.type),
                accessor: 'type',
                sortable: false,
                Cell: settings => {
                    const pageType = PAGES_TYPES.find(
                        pt => pt.value === settings.original.type,
                    );
                    return <span>{intl.formatMessage(pageType.label)}</span>;
                },
            },
            {
                Header: intl.formatMessage(MESSAGES.address),
                accessor: 'slug',
                sortable: false,
            },
            {
                Header: intl.formatMessage(MESSAGES.updatedAt),
                accessor: 'updated_at',
                sortable: false,
                Cell: settings => {
                    return (
                        <ColumnText
                            text={moment(settings.original.updated_at).format(
                                'LTS',
                            )}
                        />
                    );
                },
            },
            {
                Header: intl.formatMessage(MESSAGES.actions),
                sortable: false,
                Cell: settings => {
                    return (
                        <>
                            <a href={`/pages/${settings.original.slug}`}>
                                <IconButtonComponent
                                    icon="remove-red-eye"
                                    tooltipMessage={MESSAGES.viewPage}
                                    onClick={() => {}}
                                />
                            </a>
                            <IconButtonComponent
                                icon="edit"
                                tooltipMessage={MESSAGES.edit}
                                onClick={() =>
                                    handleClickEditRow(settings.original.slug)
                                }
                            />
                            <IconButtonComponent
                                icon="delete"
                                tooltipMessage={MESSAGES.delete}
                                onClick={() =>
                                    handleClickDeleteRow(settings.original.slug)
                                }
                            />
                        </>
                    );
                },
            },
        ],
        [handleClickDeleteRow, handleClickEditRow],
    );

    // The naming is aligned with the names in Table
    const onTableParamsChange = useCallback(
        (baseUrl, newParams) => {
            if (newParams.page !== page) {
                setPage(newParams.page);
            }
            if (newParams.pageSize !== pageSize) {
                setPageSize(newParams.pageSize);
            }
        },
        [page, pageSize],
    );

    const tableParams = useMemo(() => {
        return {
            pageSize,
            page,
        };
    }, [pageSize, page]);

    return (
        <>
            <CreateEditDialog
                selectedPage={selectedPage}
                isOpen={isCreateEditDialogOpen}
                onClose={closeCreateEditDialog}
            />
            <DeleteConfirmDialog
                isOpen={isConfirmDeleteDialogOpen}
                onClose={closeDeleteConfirmDialog}
                onConfirm={handleDeleteConfirmDialogConfirm}
            />
            <TopBar title={intl.formatMessage(MESSAGES.pages)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                {status === 'loading' && <LoadingSpinner />}
                <PageActions>
                    <PageAction
                        icon={AddIcon}
                        onClick={handleClickCreateButton}
                    >
                        {intl.formatMessage(MESSAGES.create)}
                    </PageAction>
                </PageActions>
                {status === 'success' && (
                    <Table
                        params={tableParams}
                        count={pages.count}
                        pages={Math.ceil(pages.count / pageSize)}
                        baseUrl="/polio"
                        redirectTo={onTableParamsChange}
                        columns={columns}
                        data={pages.results}
                        watchToRender={tableParams}
                    />
                )}
            </Box>
        </>
    );
};

export default Pages;
