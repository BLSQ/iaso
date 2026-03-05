import React from 'react';
import { EditUserWithButtonDialog } from 'Iaso/domains/users/components/EditUserDialog';
import MESSAGES from 'Iaso/domains/users/messages';
import { EditPasswordUserWithButtonDialog } from 'Iaso/domains/users/components/EditPasswordUserDialog';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import * as Permissions from 'Iaso/utils/permissions';
import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import { DeleteButton } from 'Iaso/components/Buttons/DeleteButton';
import { useSafeIntl } from 'bluesquare-components';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { ProfileRetrieveResponseItem } from 'Iaso/domains/users/types';

type Props = {
    userId?: number | string;
    profile?: ProfileRetrieveResponseItem;
    canBypassProjectRestrictions: boolean;
    savePassword: void;
    saveProfile: void;
    onDeleteProfile: void;
}
export const TopActions = ({
                               saveProfile,
                               profile,
                               canBypassProjectRestrictions,
                               savePassword,
                               userId,
                               onDeleteProfile,
                           }: Props) => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();

    return <>
        <EditUserWithButtonDialog
            initialData={profile}
            titleMessage={formatMessage(MESSAGES.updateUser)}
            saveProfile={saveProfile}
            canBypassProjectRestrictions={
                canBypassProjectRestrictions
            }
        />
        <EditPasswordUserWithButtonDialog
            titleMessage={MESSAGES.updateUserPassword}
            savePassword={savePassword}
            userId={userId}
        />
        {
            currentUser?.id?.toString() !== userId
            &&
            <DisplayIfUserHasPerm
                permissions={[Permissions.USERS_ADMIN, Permissions.USERS_MANAGEMENT]}
            >
                <DeleteDialog
                    titleMessage={
                        MESSAGES.deleteUserTitle
                    }
                    message={MESSAGES.deleteUserText}
                    onConfirm={onDeleteProfile}
                    Trigger={DeleteButton}
                />
            </DisplayIfUserHasPerm>
        }
    </>;
};