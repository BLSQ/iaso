import React, { FunctionComponent } from 'react';

import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    ConfirmCancelModal,
    // @ts-ignore
    makeFullModal,
} from 'bluesquare-components';

import { PublishButton, PublishIconButton } from '../ModalButtons';

import { WorkflowVersionDetail } from '../../types';
import { useUpdateWorkflowVersion } from '../../hooks/requests/useUpdateWorkflowVersion';

import MESSAGES from '../../messages';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    workflowVersion: WorkflowVersionDetail;
    invalidateQueryKey: string;
};

const PublishVersionModal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    workflowVersion,
    invalidateQueryKey,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutate: updateWorkflowVersion } = useUpdateWorkflowVersion(
        invalidateQueryKey,
        workflowVersion.version_id,
    );
    const handleConfirm = () => {
        updateWorkflowVersion({ status: 'PUBLISHED' });
    };

    return (
        <ConfirmCancelModal
            allowConfirm
            titleMessage={`${formatMessage(MESSAGES.publishVersion)} ${
                workflowVersion.name
            } ?`}
            onConfirm={handleConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="xs"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            dataTestId="add-workflow-version"
            id="add-workflow-version"
            onClose={() => null}
        >
            {formatMessage(MESSAGES.deleteText)}
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(PublishVersionModal, PublishButton);
const modalWithIcon = makeFullModal(PublishVersionModal, PublishIconButton);

export {
    modalWithButton as PublishVersionModal,
    modalWithIcon as PublishVersionIconModal,
};
