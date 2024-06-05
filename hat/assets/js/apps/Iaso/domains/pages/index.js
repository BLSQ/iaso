import React, { useCallback, useMemo, useState } from 'react';
import {
    useSafeIntl,
    commonStyles,
    IconButton,
    ExternalLinkIconButton,
} from 'bluesquare-components';
import { makeStyles } from '@mui/styles';
import { Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { useGetPages } from './hooks/useGetPages';
import { useRemovePage } from './hooks/useRemovePage';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import CreateEditDialog from './components/CreateEditDialog';
import PageActions from './components/PageActions';
import PageAction from './components/PageAction';
import { PAGES_TYPES } from './constants';
import { DateTimeCellRfc } from '../../components/Cells/DateTimeCell.tsx';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink.tsx';
import * as Permission from '../../utils/permissions.ts';
import { useParamsObject } from '../../routing/hooks/useParamsObject.tsx';
import { baseUrls } from '../../constants/urls.ts';
import { DisplayIfUserHasPerm } from '../../components/DisplayIfUserHasPerm.tsx';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;
const DEFAULT_ORDER = '-updated_at';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Pages = () => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const params = useParamsObject(baseUrls.pages);
    const [selectedPageSlug, setSelectedPageSlug] = useState();
    const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] =
        useState(false);

    const tableParams = useMemo(() => {
        return {
            order: params.order ?? DEFAULT_ORDER,
            pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
            page: params.page ?? DEFAULT_PAGE,
        };
    }, [params]);

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

    const { data: pages, isFetching } = useGetPages(tableParams);

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
                Header: formatMessage(MESSAGES.name),
                accessor: 'name',
            },
            {
                Header: formatMessage(MESSAGES.type),
                accessor: 'type',
                Cell: settings => {
                    const pageType = PAGES_TYPES.find(
                        pt => pt.value === settings.row.original.type,
                    );
                    if (!pageType) {
                        return settings.row.original.type;
                    }
                    return <span>{formatMessage(pageType.label)}</span>;
                },
            },
            {
                Header: formatMessage(MESSAGES.address),
                accessor: 'slug',
            },
            {
                Header: formatMessage(MESSAGES.updatedAt),
                accessor: 'updated_at',
                Cell: DateTimeCellRfc,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                sortable: false,
                accessor: 'actions',
                Cell: settings => {
                    return (
                        <>
                            <ExternalLinkIconButton
                                url={`/pages/${settings.row.original.slug}`}
                                icon="remove-red-eye"
                                tooltipMessage={{
                                    ...MESSAGES.viewPage,
                                    values: { linebreak: <br /> },
                                }}
                            />
                            <DisplayIfUserHasPerm
                                permissions={[Permission.PAGE_WRITE]}
                            >
                                <IconButton
                                    icon="edit"
                                    tooltipMessage={MESSAGES.edit}
                                    onClick={() =>
                                        handleClickEditRow(
                                            settings.row.original.slug,
                                        )
                                    }
                                />
                                <IconButton
                                    icon="delete"
                                    tooltipMessage={MESSAGES.delete}
                                    onClick={() =>
                                        handleClickDeleteRow(
                                            settings.row.original.slug,
                                        )
                                    }
                                />
                            </DisplayIfUserHasPerm>
                        </>
                    );
                },
            },
        ],
        [formatMessage, handleClickDeleteRow, handleClickEditRow],
    );

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
            <TopBar title={formatMessage(MESSAGES.pages)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <PageActions>
                    <PageAction
                        icon={AddIcon}
                        onClick={handleClickCreateButton}
                    >
                        {formatMessage(MESSAGES.create)}
                    </PageAction>
                </PageActions>
                <TableWithDeepLink
                    data={pages?.results ?? []}
                    pages={pages?.pages}
                    count={pages?.count}
                    params={tableParams}
                    columns={columns}
                    baseUrl="/pages"
                    extraProps={{
                        loading: isFetching,
                    }}
                />
            </Box>
        </>
    );
};

export default Pages;
