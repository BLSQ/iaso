import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useState } from 'react';
import { UseMutateAsyncFunction } from 'react-query';
import { Payment, PaymentStatus } from '../../types';
import MESSAGES from '../../messages';
import { StatusSelect } from '../StatusSelect';
import { Selection } from '../../../orgUnits/types/selection';
import { EditSelectedButton } from '../EditPaymentLot/EditSelectedButton';
import { BulkPaymentSaveBody } from '../../hooks/requests/useSavePaymentStatus';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    selection: Selection<Payment>;
    resetSelection: () => void;
    saveStatus: UseMutateAsyncFunction<any, any, BulkPaymentSaveBody, any>;
    paymentLotId: number;
};

const BulkEditPaymentDialog: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    selection,
    resetSelection,
    saveStatus,
    paymentLotId,
}) => {
    const { formatMessage } = useSafeIntl();
    const [status, setStatus] = useState<PaymentStatus>('pending');

    const handleConfirm = useCallback(() => {
        saveStatus({ ...selection, status, payment_lot_id: paymentLotId }).then(
            () => {
                resetSelection();
                closeDialog();
            },
        );
    }, [
        closeDialog,
        paymentLotId,
        resetSelection,
        saveStatus,
        selection,
        status,
    ]);
    const count = selection.selectCount;
    const titleMessage = formatMessage(MESSAGES.editSelectedPayments, {
        count,
    });
    return (
        <>
            <ConfirmCancelModal
                open={isOpen}
                onClose={() => {
                    setStatus('pending');
                }}
                id="EditPaymentDialog"
                dataTestId="EditPaymentDialog"
                titleMessage={titleMessage}
                closeDialog={closeDialog}
                onConfirm={handleConfirm}
                onCancel={() => null}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
                closeOnConfirm={false}
            >
                <StatusSelect
                    value={status}
                    onChange={value => setStatus(value)}
                />
            </ConfirmCancelModal>
        </>
    );
};

const modalWithButtons = makeFullModal(
    BulkEditPaymentDialog,
    EditSelectedButton,
);

export { modalWithButtons as BulkEditPaymentDialog };
