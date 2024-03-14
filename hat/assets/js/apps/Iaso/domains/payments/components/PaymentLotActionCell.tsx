/* eslint-disable camelcase */
import React, { ReactElement, useCallback } from 'react';
import { IconButton } from 'bluesquare-components';
import SendIcon from '@mui/icons-material/Send';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { PaymentLot } from '../types';

import MESSAGES from '../messages';
import { useMarkPaymentsAsSent } from '../hooks/requests/useSavePaymentLot';
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
    return (
        <>
            {paymentLot.status === 'new' && (
                <IconButton
                    tooltipMessage={MESSAGES.mark_as_sent}
                    overrideIcon={SendIcon}
                    onClick={handleSend}
                    iconSize="small"
                />
            )}
            <EditPaymentLotDialog iconProps={{}} paymentLot={paymentLot} />
            <IconButton
                tooltipMessage={MESSAGES.download_payments}
                overrideIcon={FileDownloadIcon}
                onClick={handleExport}
                iconSize="small"
            />
        </>
    );
};
