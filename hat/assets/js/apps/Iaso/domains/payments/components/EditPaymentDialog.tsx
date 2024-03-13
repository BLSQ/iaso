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
import { UserDisplayData } from '../../users/types';
import getDisplayName from '../../../utils/usersUtils';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    id: number;
    status: PaymentStatus;
    user: UserDisplayData;
};

const EditPaymentDialog: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    id,
    user,
    status: initialStatus,
}) => {
    const { formatMessage } = useSafeIntl();
    const [status, setStatus] = useState<PaymentStatus>(initialStatus);
    const { mutateAsync: saveStatus } = useSavePaymentStatus();
    const handleConfirm = useCallback(() => {
        return saveStatus({ id, status });
    }, [id, saveStatus, status]);
    const paymentStatusOptions = usePaymentStatusOptions();
    const userDisplayName = getDisplayName(user);
    const titleMessage = formatMessage(MESSAGES.editPaymentFor, {
        user: userDisplayName,
    });
    return (
        <ConfirmCancelModal
            open={isOpen}
            onClose={() => null}
            id="EditPaymentDialog"
            dataTestId="EditPaymentDialog"
            titleMessage={titleMessage}
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
                labelString={formatMessage(MESSAGES.changeStatus)}
                options={paymentStatusOptions}
            />
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(EditPaymentDialog, EditIconButton);

export { modalWithButton as EditPaymentDialog };
