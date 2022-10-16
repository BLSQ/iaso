import React, { FunctionComponent, useState } from 'react';

import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    ConfirmCancelModal,
    // @ts-ignore
    makeFullModal,
    // @ts-ignore
    IconButton as IconButtonComponent,
} from 'bluesquare-components';

import { Storage, StorageStatus } from '../types/storages';
import { useSaveStatus } from '../hooks/requests/useSaveStatus';

import InputComponent from '../../../components/forms/InputComponent';
import { TextArea } from '../../../components/forms/TextArea';
import { useGetReasons } from '../hooks/useGetReasons';
import { useGetStatus } from '../hooks/useGetStatus';

import MESSAGES from '../messages';

type TriggerModalProps = {
    onClick: () => void;
};
export const TriggerModal: FunctionComponent<TriggerModalProps> = ({
    onClick,
}) => (
    <IconButtonComponent
        size="small"
        onClick={onClick}
        icon="edit"
        tooltipMessage={MESSAGES.changeStatus}
    />
);

type Props = {
    isOpen: boolean;
    id?: string;
    dataTestId?: string;
    storage: Storage;
    closeDialog: () => void;
};

const StatusModal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    id,
    dataTestId,
    storage,
}) => {
    const { formatMessage } = useSafeIntl();
    const allStatus = useGetStatus();
    const [status, setStatus] = useState<StorageStatus>(storage.status);
    const reasons = useGetReasons();
    const { mutate: saveStatus } = useSaveStatus(closeDialog);
    const handleConfirm = () => {
        saveStatus({
            storage_id: storage.storage_id,
            storage_type: storage.storage_type,
            storage_status: status,
        });
    };

    const handleChange = (key, value) => {
        const newStatus = {
            ...status,
            [key]: value,
        };
        if (key === 'status' && value === 'OK') {
            newStatus.reason = undefined;
            newStatus.comment = undefined;
        }
        setStatus(newStatus);
    };

    return (
        <ConfirmCancelModal
            allowConfirm
            titleMessage={formatMessage(MESSAGES.changeStatus)}
            onConfirm={handleConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="sm"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            dataTestId={dataTestId || ''}
            id={id || ''}
            onClose={() => null}
        >
            <InputComponent
                clearable={false}
                type="select"
                keyValue="status"
                onChange={handleChange}
                value={status?.status}
                label={MESSAGES.status}
                options={allStatus}
            />
            {status?.status === 'BLACKLISTED' && (
                <>
                    <InputComponent
                        type="select"
                        keyValue="reason"
                        onChange={handleChange}
                        value={status?.reason}
                        label={MESSAGES.reason}
                        options={reasons}
                    />
                    <TextArea
                        label={formatMessage(MESSAGES.comment)}
                        value={status?.comment}
                        onChange={newComment =>
                            handleChange('comment', newComment)
                        }
                    />
                </>
            )}
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(StatusModal, TriggerModal);

export { modalWithButton as StatusModal };
