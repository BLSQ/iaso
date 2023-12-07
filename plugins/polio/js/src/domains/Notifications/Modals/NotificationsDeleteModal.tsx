import React, { FunctionComponent, useCallback } from 'react';
import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';

import MESSAGES from '../messages';
import { useDeleteNotification } from '../hooks/api';
import { NotificationsApiData } from '../types';

import { DeleteIconButton } from '../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/DeleteIconButton';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    notification: NotificationsApiData;
};

const DeleteNotificationModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    notification,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutate: deleteNotification } = useDeleteNotification();
    const onDelete = useCallback(
        () => deleteNotification(notification.id),
        [notification.id, deleteNotification],
    );
    return (
        <ConfirmCancelModal
            open={isOpen}
            closeDialog={closeDialog}
            onClose={() => null}
            id="delete-notification"
            dataTestId="delete-notification"
            titleMessage={MESSAGES.modalDeleteTitle}
            onConfirm={onDelete}
            onCancel={() => null}
            confirmMessage={MESSAGES.modalDeleteYes}
            cancelMessage={MESSAGES.modalDeleteNo}
        >
            {formatMessage(MESSAGES.modalDeleteConfirm)} (
            {notification.epid_number})
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(
    DeleteNotificationModal,
    DeleteIconButton,
);

export { modalWithButton as DeleteNotificationModal };
