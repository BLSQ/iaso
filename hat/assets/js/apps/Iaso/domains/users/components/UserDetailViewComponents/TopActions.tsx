import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { UseMutateFunction } from 'react-query';
import { DeleteButton } from 'Iaso/components/Buttons/DeleteButton';
import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { EditPasswordUserWithButtonDialog } from 'Iaso/domains/users/components/EditPasswordUserDialog';
import { EditUserWithButtonDialog } from 'Iaso/domains/users/components/EditUserDialog';
import MESSAGES from 'Iaso/domains/users/messages';
import { DjangoError } from 'Iaso/types/general';
import * as Permissions from 'Iaso/utils/permissions';
import { useCurrentUser, User } from 'Iaso/utils/usersUtils';

type Props = {
    userId?: number | string;
    canBypassProjectRestrictions: boolean;
    savePassword: UseMutateFunction<
        User,
        DjangoError,
        User | Partial<User>,
        unknown
    >;
    saveProfile: UseMutateFunction<User, DjangoError, User | Partial<User>>;
    onDeleteProfile: () => void;
};
export const TopActions = ({
    saveProfile,
    canBypassProjectRestrictions,
    savePassword,
    userId,
    onDeleteProfile,
}: Props) => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();

    return (
        <>
            <EditUserWithButtonDialog
                userId={userId}
                titleMessage={formatMessage(MESSAGES.updateUser)}
                saveProfile={saveProfile}
                canBypassProjectRestrictions={canBypassProjectRestrictions}
                iconProps={{}}
            />
            <EditPasswordUserWithButtonDialog
                titleMessage={MESSAGES.updateUserPassword}
                savePassword={savePassword}
                iconProps={{}}
            />
            {currentUser?.id?.toString() !== userId && (
                <DisplayIfUserHasPerm
                    permissions={[
                        Permissions.USERS_ADMIN,
                        Permissions.USERS_MANAGEMENT,
                    ]}
                >
                    <DeleteDialog
                        titleMessage={MESSAGES.deleteUserTitle}
                        message={MESSAGES.deleteUserText}
                        onConfirm={onDeleteProfile}
                        Trigger={DeleteButton}
                    />
                </DisplayIfUserHasPerm>
            )}
        </>
    );
};
