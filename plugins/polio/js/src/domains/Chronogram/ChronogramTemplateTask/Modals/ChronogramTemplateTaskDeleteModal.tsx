import React, { FunctionComponent, useCallback } from 'react';
import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';

import MESSAGES from '../messages';

import { ChronogramTemplateTask } from '../types';

import { DeleteIconButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/DeleteIconButton';
import { useDeleteChronogramTemplateTask } from '../api/useDeleteChronogramTemplateTask';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    chronogramTemplateTask: ChronogramTemplateTask;
};

const ChronogramTemplateTaskDeleteModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    chronogramTemplateTask,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutate: deleteChronogramTemplateTask } =
        useDeleteChronogramTemplateTask();
    const onDelete = useCallback(
        () => deleteChronogramTemplateTask(chronogramTemplateTask.id),
        [chronogramTemplateTask.id, deleteChronogramTemplateTask],
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
            confirmMessage={MESSAGES.yes}
            cancelMessage={MESSAGES.no}
        >
            <p>{formatMessage(MESSAGES.modalDeleteConfirm)}</p>
            <p>{chronogramTemplateTask.description}</p>
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(
    ChronogramTemplateTaskDeleteModal,
    DeleteIconButton,
);

export { modalWithButton as DeleteChronogramTemplateTask };
