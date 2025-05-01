import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
} from 'react';
import isEqual from 'lodash/isEqual';
import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
} from 'bluesquare-components';
import { Storage, StorageStatus } from '../types/storages';
import { useSaveStatus } from '../hooks/requests/useSaveStatus';
import { ModalButton } from './ModalButton';
import InputComponent from '../../../components/forms/InputComponent';
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
    const [status, setStatus] = useState<StorageStatus>(storage.storage_status);
    const reasons = useGetReasons();
    const { mutate: saveStatus } = useSaveStatus(closeDialog);
    const handleConfirm = () => {
        saveStatus({
            storage_id: storage.storage_id,
            storage_type: storage.storage_type,
            storage_status: status,
        });
    };

    const handleChange = useCallback(
        (key, value) => {
            const newStatus = {
                ...status,
                [key]: value,
            };
            if (key === 'status' && value === 'OK') {
                delete newStatus.reason;
                delete newStatus.comment;
            }
            setStatus(newStatus);
        },
        [status],
    );

    const allowConfirm = useMemo(() => {
        if (status?.status === 'BLACKLISTED' && !status.reason) {
            return false;
        }
        return !isEqual(status, storage.storage_status);
    }, [status, storage.storage_status]);
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
                    <InputComponent
                        type="textarea"
                        keyValue="comment"
                        labelString={formatMessage(MESSAGES.comment)}
                        value={status?.comment}
                        onChange={handleChange}
                    />
                </>
            )}
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(StatusModal, ModalButton);

export { modalWithButton as StatusModal };
