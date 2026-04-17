import React, { useMemo } from 'react';
import {
    Column,
    IconButton,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';

import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { baseUrls } from 'Iaso/constants/urls';
import { useCreateExportMobileSetup } from 'Iaso/domains/users/hooks/useCreateExportMobileSetup';
import { useDeleteProfile } from 'Iaso/domains/users/hooks/useDeleteProfile';
import { useSaveProfile } from 'Iaso/domains/users/hooks/useSaveProfile';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import * as Permission from '../../utils/permissions';
import { ProjectChips } from '../projects/components/ProjectChips';
import { EditUserWithIconDialog } from './components/EditUserDialog';
import { ExportMobileAppSetupDialog } from './components/ExportMobileAppSetupDialog';
import PermissionCheckBoxes from './components/PermissionCheckBoxes';
import PermissionTooltip from './components/PermissionTooltip';
import { UserRolePermissions } from './components/UserRolePermissions';
import MESSAGES from './messages';
import PERMISSIONS_GROUPS_MESSAGES from './permissionsGroupsMessages';
import { userHasOneOfPermissions } from './utils';

type UseUsersTableColumnsProps = {
    canBypassProjectRestrictions: boolean;
    currentUser: ReturnType<typeof useCurrentUser>;
    params: {
        pageSize?: string;
        search?: string;
    };
    deleteProfile: ReturnType<typeof useDeleteProfile>['mutate'];
    saveProfile: ReturnType<typeof useSaveProfile>['mutate'];
    exportMobileSetup: ReturnType<
        typeof useCreateExportMobileSetup
    >['mutateAsync'];
};

export const useUsersTableColumns = ({
    deleteProfile,
    params,
    currentUser,
    saveProfile,
    exportMobileSetup,
    canBypassProjectRestrictions,
}: UseUsersTableColumnsProps): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.projects),
                id: 'projects__name',
                accessor: 'projects',
                sortable: false,
                Cell: settings => <ProjectChips projects={settings.value} />,
            },
            {
                Header: formatMessage(MESSAGES.userName),
                id: 'user__username',
                sortable: false,
                accessor: 'user_name',
            },
            {
                Header: formatMessage(MESSAGES.firstName),
                id: 'user__first_name',
                sortable: false,
                accessor: 'first_name',
            },
            {
                Header: formatMessage(MESSAGES.lastName),
                id: 'user__last_name',
                sortable: false,
                accessor: 'last_name',
            },
            {
                Header: formatMessage(MESSAGES.phoneNumber),
                id: 'phone_number',
                sortable: false,
                accessor: 'phone_number',
                Cell: settings =>
                    settings.value ? (
                        <a href={`tel:${settings.value}`}>{settings.value}</a>
                    ) : (
                        textPlaceholder
                    ),
            },
            {
                Header: formatMessage(MESSAGES.email),
                id: 'user__email',
                sortable: false,
                accessor: 'email',
                Cell: settings =>
                    settings.value ? (
                        <a href={`mailto:${settings.value}`}>
                            {settings.value}
                        </a>
                    ) : (
                        textPlaceholder
                    ),
            },
            {
                Header: formatMessage(MESSAGES.userRoles),
                id: 'annotated_first_user_role',
                accessor: 'user_roles',
                Cell: settings =>
                    settings.value
                        ?.map(user_role => user_role.name)
                        .join(', ') || textPlaceholder,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                resizable: false,
                sortable: false,
                Cell: settings => (
                    <section>
                        <IconButton
                            url={`/${baseUrls.userDetails}/userId/${settings.row.original.id}`}
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.viewUser}
                        />
                        <EditUserWithIconDialog
                            userId={settings.row.original.id}
                            titleMessage={MESSAGES.updateUser}
                            params={params}
                            saveProfile={saveProfile}
                            canBypassProjectRestrictions={
                                canBypassProjectRestrictions
                            }
                        />
                        {currentUser.id !== settings.row.original.id &&
                            userHasOneOfPermissions(
                                [
                                    Permission.USERS_ADMIN,
                                    Permission.USERS_MANAGEMENT,
                                ],
                                currentUser,
                            ) && (
                                <DeleteDialog
                                    disabled={
                                        settings.row.original.instances_count >
                                        0
                                    }
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
        ],
        [currentUser],
    );
};

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
