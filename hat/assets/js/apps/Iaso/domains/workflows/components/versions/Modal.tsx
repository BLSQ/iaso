import React, { FunctionComponent, useState } from 'react';

import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
    AddButton,
} from 'bluesquare-components';
import { useCreateWorkflowVersion } from '../../hooks/requests/useCreateWorkflowVersion';

import InputComponent from '../../../../components/forms/InputComponent';

import MESSAGES from '../../messages';

type Props = {
    entityTypeId: string;
    isOpen: boolean;
    closeDialog: () => void;
};

const AddVersionModal: FunctionComponent<Props> = ({
    entityTypeId,
    closeDialog,
    isOpen,
}) => {
    const { formatMessage } = useSafeIntl();
    const [name, setName] = useState<string>('');
    const { mutate: createWorkflowVersion } =
        useCreateWorkflowVersion(closeDialog);
    const handleConfirm = () => {
        createWorkflowVersion({
            name,
            entityTypeId,
        });
    };

    return (
        <ConfirmCancelModal
            allowConfirm={Boolean(name && name !== '')}
            titleMessage={formatMessage(MESSAGES.addWorkflowVersion)}
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
            <InputComponent
                required
                clearable={false}
                type="text"
                keyValue="name"
                onChange={(_, newName) => setName(newName)}
                value={name}
                label={MESSAGES.name}
            />
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(AddVersionModal, AddButton);

export { modalWithButton as AddVersionModal };
