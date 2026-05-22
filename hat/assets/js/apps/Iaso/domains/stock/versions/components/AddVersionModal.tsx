import React, { FunctionComponent, useState } from 'react';

import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
    AddButton,
} from 'bluesquare-components';

import InputComponent from '../../../../components/forms/InputComponent';

import MESSAGES from '../../messages';
import { useCreateStockRulesVersion } from '../hooks/requests';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

const AddVersionModal: FunctionComponent<Props> = ({ closeDialog, isOpen }) => {
    const { formatMessage } = useSafeIntl();
    const [name, setName] = useState<string>('');
    const { mutate: createWorkflowVersion } =
        useCreateStockRulesVersion(closeDialog);
    const handleConfirm = () => {
        createWorkflowVersion({ name });
    };

    return (
        <ConfirmCancelModal
            allowConfirm={Boolean(name && name !== '')}
            titleMessage={formatMessage(MESSAGES.add)}
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
