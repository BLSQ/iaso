import React, { ReactElement } from 'react';
import { useSafeIntl, Column, IntlFormatMessage } from 'bluesquare-components';
import { CreateEditUserRole } from './components/CreateEditUserRole';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';
import MESSAGES from './messages';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import { UserRole } from './types/userRoles';

export const useGetUserRolesColumns = (
    // eslint-disable-next-line no-unused-vars
    deleteUserRole: (userRole: UserRole) => void,
): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    const columns: Column[] = [
        {
            Header: formatMessage(MESSAGES.name),
            accessor: 'name',
            id: 'group__name',
        },
        {
            Header: formatMessage(MESSAGES.created_at),
            accessor: 'created_at',
            id: 'created_at',
            Cell: DateTimeCell,
        },
        {
            Header: formatMessage(MESSAGES.updated_at),
            accessor: 'updated_at',
            id: 'updated_at',
            Cell: DateTimeCell,
        },
        {
            Header: formatMessage(MESSAGES.actions),
            accessor: 'actions',
            resizable: false,
            sortable: false,
            Cell: (settings): ReactElement => {
                return (
                    <>
                        <CreateEditUserRole
                            dialogType="edit"
                            id={settings.row.original.id}
                            name={settings.row.original.name}
                            permissions={settings.row.original.permissions}
                        />
                        <DeleteDialog
                            keyName="userRole"
                            titleMessage={MESSAGES.delete}
                            onConfirm={() =>
                                deleteUserRole(settings.row.original)
                            }
                        />
                    </>
                );
            },
        },
    ];
    return columns;
};
