import React, { FunctionComponent } from 'react';

import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
} from 'bluesquare-components';

import { PublishButton, PublishIconButton } from '../ModalButtons';

import { WorkflowVersion } from '../../types';
import { useUpdateWorkflowVersion } from '../../hooks/requests/useUpdateWorkflowVersion';

import MESSAGES from '../../messages';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    workflowVersion: WorkflowVersion;
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
            dataTestId="publish-workflow-version"
            id="publish-workflow-version"
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
