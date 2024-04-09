/* eslint-disable camelcase */
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SendIcon from '@mui/icons-material/Send';
import { IconButton } from 'bluesquare-components';
import React, { ReactElement, useCallback } from 'react';
import { PaymentLot } from '../types';

import { useMarkPaymentsAsSent } from '../hooks/requests/useSavePaymentLot';
import MESSAGES from '../messages';
import { EditPaymentLotDialog } from './EditPaymentLot/EditPaymentLotDialog';

interface ActionCellProps<T> {
    row: {
        original: T;
    };
}
export const PaymentLotActionCell = ({
    row: { original: paymentLot },
}: ActionCellProps<PaymentLot>): ReactElement => {
    const { mutateAsync: markAsSent } = useMarkPaymentsAsSent();

    const handleSend = useCallback(() => {
        markAsSent({
            id: paymentLot.id,
            mark_payments_as_sent: true,
        });
    }, [paymentLot.id, markAsSent]);
    const handleExport = useCallback(() => {
        window.open(`/api/payments/lots/${paymentLot.id}/?xlsx=true`, '_blank');
    }, [paymentLot.id]);
    const disableButtons =
        paymentLot.task?.status === 'QUEUED' ||
        paymentLot.task?.status === 'RUNNING';

    return (
        <>
            {paymentLot.status === 'new' && (
                <IconButton
                    tooltipMessage={MESSAGES.mark_as_sent}
                    overrideIcon={SendIcon}
                    onClick={handleSend}
                    iconSize="small"
                    disabled={disableButtons}
                />
            )}
            <EditPaymentLotDialog
                iconProps={{ disabled: disableButtons }}
                paymentLot={paymentLot}
            />
            <IconButton
                tooltipMessage={MESSAGES.download_payments}
                overrideIcon={FileDownloadIcon}
                onClick={handleExport}
                iconSize="small"
                disabled={disableButtons}
            />
        </>
    );
};
