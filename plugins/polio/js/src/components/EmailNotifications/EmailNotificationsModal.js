import React from 'react';
import ConfirmCancelDialogComponent from '../../../../../../hat/assets/js/apps/Iaso/components/dialogs/ConfirmCancelDialogComponent';

export const EmailNotificationsModal = ({ renderTrigger }) => {
    return (
        <ConfirmCancelDialogComponent renderTrigger={renderTrigger}>
            <p>Vous êtes un tigre de papier</p>
        </ConfirmCancelDialogComponent>
    );
};
