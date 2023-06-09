import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { MESSAGES } from './messages';

type Props = {
    open: boolean;
    closeDialog: () => void;
    onConfirm: () => void;
};

export const WarningModal: FunctionComponent<Props> = ({
    open,
    closeDialog,
    onConfirm,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <ConfirmCancelModal
            open={open}
            id="user-WarningModal"
            dataTestId="user-WarningModal"
            titleMessage={formatMessage(MESSAGES.createUserWithoutPerm)}
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onClose={() => {}}
            closeDialog={closeDialog}
            onConfirm={onConfirm}
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onCancel={() => {}}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
        >
            You are about to create a user with no permissions. This user will
            have access to the mobile application but not to the features of the
            web interface.
        </ConfirmCancelModal>
    );
};
