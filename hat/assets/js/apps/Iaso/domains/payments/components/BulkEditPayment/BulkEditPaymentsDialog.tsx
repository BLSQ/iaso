import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useState } from 'react';
import { Payment, PaymentStatus } from '../../types';
import MESSAGES from '../../messages';
import { StatusSelect } from '../StatusSelect';
import { Selection } from '../../../orgUnits/types/selection';
import { EditSelectedButton } from '../EditPaymentLot/EditSelectedButton';
import { useBulkSavePaymentStatus } from '../../hooks/requests/useSavePaymentStatus';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    selection: Selection<Payment>;
    resetSelection: () => void;
};

const BulkEditPaymentDialog: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    selection,
    resetSelection,
}) => {
    const { formatMessage } = useSafeIntl();
    const [status, setStatus] = useState<PaymentStatus>('pending');
    const { mutateAsync: saveStatus } = useBulkSavePaymentStatus();

    const handleConfirm = useCallback(() => {
        saveStatus({ ...selection, status }).then(() => {
            resetSelection();
            closeDialog();
        });
    }, [closeDialog, resetSelection, saveStatus, selection, status]);
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
