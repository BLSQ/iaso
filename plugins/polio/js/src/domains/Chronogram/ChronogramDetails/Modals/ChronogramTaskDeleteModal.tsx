import React, { FunctionComponent, useCallback } from 'react';
import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';

import MESSAGES from '../messages';

import { ChronogramTask } from '../../Chronogram/types';

import { DeleteIconButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/DeleteIconButton';
import { useDeleteChronogramTask } from '../api/useDeleteChronogramTask';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    chronogramTask: ChronogramTask;
};

const ChronogramTaskDeleteModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    chronogramTask,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutate: deleteChronogramTask } = useDeleteChronogramTask();
    const onDelete = useCallback(
        () => deleteChronogramTask(chronogramTask.id),
        [chronogramTask.id, deleteChronogramTask],
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
            <p>{formatMessage(MESSAGES.modalDeleteConfirm)}</p>
            <p>{chronogramTask.description}</p>
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(
    ChronogramTaskDeleteModal,
    DeleteIconButton,
);

export { modalWithButton as DeleteChronogramTask };
