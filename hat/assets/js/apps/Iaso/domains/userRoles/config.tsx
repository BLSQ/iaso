import { Column, IntlFormatMessage, useSafeIntl } from 'bluesquare-components';
import React, { ReactElement, useMemo } from 'react';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import PermissionCheckBoxes from '../users/components/PermissionCheckBoxes';
import PermissionTooltip from '../users/components/PermissionTooltip';
import USER_MESSAGES from '../users/messages';
import { EditUserRoleDialog } from './components/CreateEditUserRole';
import MESSAGES from './messages';
import { Permission, UserRole } from './types/userRoles';

export const useGetUserRolesColumns = (
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
                                editable_org_unit_type_ids={
                                    settings.row.original
                                        .editable_org_unit_type_ids
                                }
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
    setPermissions: (permission: string, isChecked: boolean) => void,
    userRolePermissions: (string | Permission)[],
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
                        <PermissionCheckBoxes
                            codeName="codename"
                            settings={settings}
                            setPermissions={setPermissions}
                            value={settings.row.original.codename}
                            permissions={userRolePermissions}
                        />
                    );
                },
            },
        ];
    }, [formatMessage, setPermissions, userRolePermissions]);
};
