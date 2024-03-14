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
import { BulkEditWarning } from './BulkEditWarning';

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
    const [isWarningOpen, setIsWarningOpen] = useState<boolean>(false);
    const { mutateAsync: saveStatus } = useBulkSavePaymentStatus();

    const handleConfirm = useCallback(() => {
        saveStatus({ ...selection, status }).then(() => {
            setIsWarningOpen(false);
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
            <BulkEditWarning
                open={isWarningOpen}
                closeDialog={() => setIsWarningOpen(false)}
                selectCount={selection.selectCount}
                onConfirm={handleConfirm}
            />
            <ConfirmCancelModal
                open={isOpen}
                onClose={() => {
                    setStatus('pending');
                    setIsWarningOpen(false);
                }}
                id="EditPaymentDialog"
                dataTestId="EditPaymentDialog"
                titleMessage={titleMessage}
                closeDialog={closeDialog}
                onConfirm={() => setIsWarningOpen(true)}
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
