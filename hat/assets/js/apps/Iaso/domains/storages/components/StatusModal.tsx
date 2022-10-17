import React, { FunctionComponent, useState, useMemo } from 'react';

import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    ConfirmCancelModal,
    // @ts-ignore
    makeFullModal,
} from 'bluesquare-components';

import { Storage, StorageStatus } from '../types/storages';
import { useSaveStatus } from '../hooks/requests/useSaveStatus';

import { TriggerModal } from './TriggerModal';
import InputComponent from '../../../components/forms/InputComponent';
import { TextArea } from '../../../components/forms/TextArea';
import { useGetReasons } from '../hooks/useGetReasons';
import { useGetStatus } from '../hooks/useGetStatus';

import MESSAGES from '../messages';

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
    const allowConfirm = useMemo(() => {
        if (status?.status === 'BLACKLISTED' && !status.reason) {
            return false;
        }
        return true;
    }, [status.reason, status?.status]);
    return (
        <ConfirmCancelModal
            allowConfirm={allowConfirm}
            titleMessage={formatMessage(MESSAGES.changeStatus)}
            onConfirm={handleConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="xs"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            dataTestId={dataTestId || ''}
            id={id || ''}
            onClose={() => null}
        >
            <InputComponent
                required
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
                        required
                        clearable={false}
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
