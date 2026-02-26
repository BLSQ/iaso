import React, { FunctionComponent, useCallback } from 'react';
import { ConfirmCancelModal, IntlMessage, makeFullModal } from 'bluesquare-components';
import { EditButton } from 'Iaso/domains/users/components/EditButton';
import MESSAGES from 'Iaso/domains/users/messages';
import { InitialUserData } from 'Iaso/domains/users/types';
import { MutateFunction } from 'react-query';
import { Profile } from 'Iaso/utils/usersUtils';

type Props = {
    titleMessage: IntlMessage;
    savePassword: MutateFunction<Profile, any>;
    closeDialog: () => void;
    isOpen: boolean;
};

const EditPasswordUserDialogComponent: FunctionComponent<Props> = ({titleMessage, isOpen, closeDialog, savePassword}) => {

    const onConfirm = useCallback(() => {

    }, [])
    return <ConfirmCancelModal
        titleMessage={titleMessage}
        onConfirm={onConfirm}
        cancelMessage={MESSAGES.cancel}
        confirmMessage={MESSAGES.save}
        maxWidth="md"
        open={isOpen}
        closeDialog={closeDialog}
        allowConfirm={true}
        onClose={() => null}
        onCancel={closeDialog}
        id="update-user-password-dialog"
        dataTestId="update-user-password-dialog"
        closeOnConfirm={false}>
        <div></div>
    </ConfirmCancelModal>;
};
export const modalWithButton = makeFullModal(
    EditPasswordUserDialogComponent,
    EditButton,
);
export { modalWithButton as EditPasswordUserWithButtonDialog };