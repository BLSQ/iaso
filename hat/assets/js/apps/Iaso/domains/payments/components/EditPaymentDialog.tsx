import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
} from 'bluesquare-components';
import MESSAGES from '../messages';
import InputComponent from '../../../components/forms/InputComponent';
import { PaymentStatus } from '../types';
import { useSavePaymentStatus } from '../hooks/requests/useSavePaymentStatus';
import { usePaymentStatusOptions } from '../hooks/utils';
import { EditIconButton } from '../../../components/Buttons/EditIconButton';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    id: number;
    status: PaymentStatus;
};

const EditPaymentDialog: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    id,
    status: initialStatus,
}) => {
    const { formatMessage } = useSafeIntl();
    const [status, setStatus] = useState<PaymentStatus>(initialStatus);
    const { mutateAsync: saveStatus } = useSavePaymentStatus();
    const handleConfirm = useCallback(() => {
        return saveStatus({ id, status });
    }, [id, saveStatus, status]);
    const paymentStatusOptions = usePaymentStatusOptions();
    console.log('status', status);
    return (
        <ConfirmCancelModal
            open={isOpen}
            onClose={() => null}
            id="EditPaymentDialog"
            dataTestId="EditPaymentDialog"
            titleMessage={undefined}
            closeDialog={closeDialog}
            onConfirm={handleConfirm}
            onCancel={() => setStatus(initialStatus)}
            confirmMessage={MESSAGES.save}
            cancelMessage={MESSAGES.cancel}
        >
            <InputComponent
                type="select"
                keyValue="status"
                value={status}
                clearable={false}
                required
                onChange={(_, value) => setStatus(value)}
                label={formatMessage(MESSAGES.changeStatus)}
                options={paymentStatusOptions}
            />
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(EditPaymentDialog, EditIconButton);

export { modalWithButton as EditPaymentDialog };
