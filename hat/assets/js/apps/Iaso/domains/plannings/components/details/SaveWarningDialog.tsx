import React, { FC } from 'react';
import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';
import { noop } from 'lodash';
import { usePlanningContext } from '../../contexts/PlanningContext';
import MESSAGES from '../../messages';

export const SaveWarningDialog: FC = () => {
    const { isSaveWarningOpen, confirmSave, closeSaveWarning } =
        usePlanningContext();
    const { formatMessage } = useSafeIntl();
    return (
        <ConfirmCancelModal
            id="planning-save-warning-dialog"
            dataTestId="planning-save-warning-dialog"
            open={isSaveWarningOpen}
            closeDialog={closeSaveWarning}
            onClose={noop}
            onCancel={noop}
            onConfirm={confirmSave}
            titleMessage={formatMessage(MESSAGES.planningWarningTitle)}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
        >
            {formatMessage(MESSAGES.planningWarningMessage)}
        </ConfirmCancelModal>
    );
};
