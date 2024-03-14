import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
} from 'bluesquare-components';
import { UseMutateAsyncFunction } from 'react-query';
import MESSAGES from '../../messages';
import { PaymentStatus } from '../../types';
import { SavePaymentStatusArgs } from '../../hooks/requests/useSavePaymentStatus';
import { EditIconButton } from '../../../../components/Buttons/EditIconButton';
import { UserDisplayData } from '../../../users/types';
import getDisplayName from '../../../../utils/usersUtils';
import { StatusSelect } from '../StatusSelect';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    id: number;
    status: PaymentStatus;
    user: UserDisplayData;
    saveStatus: UseMutateAsyncFunction<any, any, SavePaymentStatusArgs, any>;
};

const EditPaymentDialog: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    id,
    user,
    status: initialStatus,
    saveStatus,
}) => {
    const { formatMessage } = useSafeIntl();
    const [status, setStatus] = useState<PaymentStatus>(initialStatus);
    const handleConfirm = useCallback(() => {
        return saveStatus({ id, status });
    }, [id, saveStatus, status]);
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
            <StatusSelect value={status} onChange={value => setStatus(value)} />
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(EditPaymentDialog, EditIconButton);

export { modalWithButton as EditPaymentDialog };
