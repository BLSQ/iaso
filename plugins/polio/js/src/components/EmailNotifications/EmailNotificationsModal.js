import React from 'react';
import ConfirmCancelDialogComponent from '../../../../../../hat/assets/js/apps/Iaso/components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../../constants/messages';
import { getCountryConfigDetails } from './requests';
import { useAPI } from '../../../../../../hat/assets/js/apps/Iaso/utils/requests';

export const EmailNotificationsModal = ({
    renderTrigger,
    countryId,
    blockFetch,
    onConfirm,
}) => {
    const { data: countryDetails } = useAPI(
        getCountryConfigDetails,
        countryId,
        { preventTrigger: blockFetch, additionalDependencies: [] },
    );
    console.log('blockFetch', countryId, blockFetch);
    return (
        <ConfirmCancelDialogComponent
            renderTrigger={renderTrigger}
            titleMessage={MESSAGES.configEmailNotif}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            onConfim={() => {
                console.log('onConfirm');
            }}
            allowConfirm
        >
            <p>Vous êtes un tigre de papier</p>
        </ConfirmCancelDialogComponent>
    );
};

// onConfirm={onConfirm}
// // eslint-disable-next-line no-unused-vars
// onClosed={reset}

// allowConfirm={allowConfirm}
