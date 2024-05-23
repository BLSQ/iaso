import React, { ReactElement, useMemo } from 'react';
import { useSafeIntl, Column, IntlFormatMessage } from 'bluesquare-components';
import { EditUserRoleDialog } from './components/CreateEditUserRole';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';
import MESSAGES from './messages';
import USER_MESSAGES from '../users/messages';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import { UserRole, Permission } from './types/userRoles';
import PermissionTooltip from '../users/components/PermissionTooltip';
import PermissionSwitch from '../users/components/PermissionSwitch';

export const useGetUserRolesColumns = (
    // eslint-disable-next-line no-unused-vars
    deleteUserRole: (userRole: UserRole) => void,
): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return useMemo(() => {
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
                            <EditUserRoleDialog
                                dialogType="edit"
                                id={settings.row.original.id}
                                name={settings.row.original.name}
                                permissions={settings.row.original.permissions}
                                iconProps={{}}
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
    }, [deleteUserRole, formatMessage]);
};

export const useUserPermissionColumns = (
    // eslint-disable-next-line no-unused-vars
    setPermissions: (permission: Permission, isChecked: boolean) => void,
    userRolePermissions: Permission[],
): Array<Column> => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: '',
                id: 'tooltip',
                sortable: false,
                align: 'center',
                width: 50,
                Cell: settings => {
                    return (
                        <PermissionTooltip
                            codename={`${settings.row.original.codename}_tooltip`}
                        />
                    );
                },
            },
            {
                Header: formatMessage(USER_MESSAGES.permissions),
                id: 'name',
                accessor: 'name',
                sortable: false,
                width: 250,
                align: 'left',
                Cell: settings => {
                    if (settings.row.original.group) {
                        return (
                            <strong>{settings.row.original.codename}</strong>
                        );
                    }
                    return settings.row.original.name;
                },
            },
            {
                Header: formatMessage(MESSAGES.userRolePermissions),
                id: 'codename',
                accessor: 'codename',
                sortable: false,
                Cell: settings => {
                    return (
                        <PermissionSwitch
                            codeName="codename"
                            settings={settings}
                            setPermissions={setPermissions}
                            value={settings.row.original}
                            permissions={userRolePermissions}
                        />
                    );
                },
            },
        ];
    }, [formatMessage, setPermissions, userRolePermissions]);
};
