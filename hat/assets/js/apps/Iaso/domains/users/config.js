import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import React, { useMemo } from 'react';

import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import { ExportMobileAppSetupDialog } from './components/ExportMobileAppSetupDialog.tsx';
import { EditUsersDialog } from './components/UsersDialog.tsx';
import MESSAGES from './messages.ts';
import { userHasOneOfPermissions } from './utils';

import * as Permission from '../../utils/permissions.ts';
import PermissionCheckBoxes from './components/PermissionCheckBoxes.tsx';
import PermissionTooltip from './components/PermissionTooltip.tsx';
import PERMISSIONS_GROUPS_MESSAGES from './permissionsGroupsMessages.ts';
import { DisplayIfUserHasPerm } from '../../components/DisplayIfUserHasPerm.tsx';
import { UserRolePermissions } from './components/UserRolePermissions.tsx';

export const usersTableColumns = ({
    formatMessage,
    deleteProfile,
    params,
    currentUser,
    saveProfile,
    exportMobileSetup,
}) => [
    {
        Header: formatMessage(MESSAGES.projects),
        id: 'projects',
        accessor: 'projects',
        sortable: false,
        Cell: settings =>
            settings.value?.map(project => project.name).join(', ') ||
            textPlaceholder,
    },
    {
        Header: formatMessage(MESSAGES.userName),
        id: 'user__username',
        accessor: 'user_name',
    },
    {
        Header: formatMessage(MESSAGES.firstName),
        id: 'user__first_name',
        accessor: 'first_name',
    },
    {
        Header: formatMessage(MESSAGES.lastName),
        id: 'user__last_name',
        accessor: 'last_name',
    },
    {
        Header: formatMessage(MESSAGES.email),
        id: 'user__email',
        accessor: 'email',
        Cell: settings =>
            settings.value ? (
                <a href={`mailto:${settings.value}`}>{settings.value}</a>
            ) : (
                textPlaceholder
            ),
    },
    {
        Header: formatMessage(MESSAGES.userRoles),
        id: 'user_roles',
        accessor: 'user_roles_permissions',
        sortable: false,
        Cell: settings =>
            settings.value?.map(user_role => user_role.name).join(', ') ||
            textPlaceholder,
    },
    {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        resizable: false,
        sortable: false,
        Cell: settings => (
            <section>
                <EditUsersDialog
                    initialData={settings.row.original}
                    titleMessage={MESSAGES.updateUser}
                    params={params}
                    saveProfile={saveProfile}
                />
                {currentUser.id !== settings.row.original.id &&
                    userHasOneOfPermissions(
                        [Permission.USERS_ADMIN, Permission.USERS_MANAGEMENT],
                        currentUser,
                    ) && (
                        <DeleteDialog
                            disabled={settings.row.original.instances_count > 0}
                            titleMessage={MESSAGES.deleteUserTitle}
                            message={MESSAGES.deleteUserText}
                            onConfirm={() =>
                                deleteProfile(settings.row.original)
                            }
                        />
                    )}

                <DisplayIfUserHasPerm
                    permissions={[Permission.MOBILE_APP_OFFLINE_SETUP]}
                >
                    <ExportMobileAppSetupDialog
                        selectedUser={settings.row.original}
                        titleMessage={MESSAGES.exportMobileAppTitle}
                        params={params}
                        onCreateExport={exportMobileSetup}
                    />
                </DisplayIfUserHasPerm>
            </section>
        ),
    },
];

export const useUserPermissionColumns = ({ setPermissions, currentUser }) => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const columns = [
            {
                Header: '',
                id: 'tooltip',
                sortable: false,
                align: 'center',
                width: 50,
                Cell: settings => {
                    return (
                        <PermissionTooltip
                            codename={`${settings.row.original.permissionCodeName}_tooltip`}
                        />
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.permissions),
                id: 'permission',
                accessor: 'permission',
                sortable: false,
                width: 250,
                align: 'left',
                Cell: settings => {
                    if (settings.row.original.group) {
                        return (
                            <strong>
                                {formatMessage(
                                    PERMISSIONS_GROUPS_MESSAGES[
                                        settings.row.original.permission
                                    ],
                                )}
                            </strong>
                        );
                    }
                    return settings.row.original.permission;
                },
            },
            {
                Header: formatMessage(MESSAGES.userPermissions),
                id: 'userPermission',
                accessor: 'userPermission',
                sortable: false,
                align: 'center',
                Cell: settings => {
                    return (
                        <PermissionCheckBoxes
                            codeName="permissionCodeName"
                            settings={settings}
                            setPermissions={setPermissions}
                            value={settings.row.original.permissionCodeName}
                            permissions={settings.row.original.userPermissions}
                        />
                    );
                },
            },
        ];

        currentUser.user_roles_permissions.value.forEach(role => {
            columns.push({
                Header: role.name,
                id: role.id.toString(),
                accessor: role.id.toString(),
                sortable: false,
                width: 50,
                Cell: settings => {
                    if (!settings.row.original.group) {
                        return (
                            <UserRolePermissions
                                original={settings.row.original}
                                userRolepermissions={role.permissions}
                            />
                        );
                    }
                    return '';
                },
            });
        });
        return columns;
    }, [
        currentUser.user_roles_permissions.value,
        formatMessage,
        setPermissions,
    ]);
};
