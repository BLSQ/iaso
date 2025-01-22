import {
    Column,
    ExternalLinkIconButton,
    IconButton,
    useSafeIntl,
} from 'bluesquare-components';
import React, { useCallback, useMemo } from 'react';
import { baseUrls } from '../../constants/urls';
import { DateTimeCellRfc } from '../../components/Cells/DateTimeCell';
import MESSAGES from './messages';
import { PAGES_TYPES } from './constants';
import { DisplayIfUserHasPerm } from '../../components/DisplayIfUserHasPerm';
import * as Permission from '../../utils/permissions';
import { EditIconButton } from '../../components/Buttons/EditIconButton';
import { DeleteIconButton } from '../../components/Buttons/DeleteIconButton';

export const baseUrl = baseUrls.pages;

export const usePagesColumns = (
    setSelectedPageSlug,
    setIsCreateEditDialogOpen,
    setIsConfirmDeleteDialogOpen,
): Column[] => {
    const openCreateEditDialog = useCallback(() => {
        setIsCreateEditDialogOpen(true);
    }, [setIsCreateEditDialogOpen]);
    const openDeleteConfirmDialog = useCallback(() => {
        setIsConfirmDeleteDialogOpen(true);
    }, [setIsConfirmDeleteDialogOpen]);
    const handleClickEditRow = useCallback(
        slug => {
            setSelectedPageSlug(slug);
            openCreateEditDialog();
        },
        [setSelectedPageSlug, openCreateEditDialog],
    );
    const handleClickDeleteRow = useCallback(
        slug => {
            setSelectedPageSlug(slug);
            openDeleteConfirmDialog();
        },
        [setSelectedPageSlug, openDeleteConfirmDialog],
    );
    const { formatMessage } = useSafeIntl();
    return useMemo(
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
                    return formatMessage(pageType.label);
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
                Cell: settings => (
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
                            <EditIconButton
                                onClick={() =>
                                    handleClickEditRow(
                                        settings.row.original.slug,
                                    )
                                }
                            />
                        </DisplayIfUserHasPerm>
                        <DisplayIfUserHasPerm
                            permissions={[Permission.PAGE_WRITE]}
                        >
                            <DeleteIconButton
                                onClick={() =>
                                    handleClickDeleteRow(
                                        settings.row.original.slug,
                                    )
                                }
                            />
                        </DisplayIfUserHasPerm>
                    </>
                ),
            },
        ],
        [formatMessage, handleClickDeleteRow, handleClickEditRow],
    );
};
