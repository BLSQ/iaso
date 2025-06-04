import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SendIcon from '@mui/icons-material/Send';
import { ExternalLinkIconButton, IconButton } from 'bluesquare-components';
import React, { ReactElement, useCallback } from 'react';
import { PaymentLot } from '../types';

import { useMarkPaymentsAsSent } from '../hooks/requests/useSavePaymentLot';
import MESSAGES from '../messages';
import { EditPaymentLotDialog } from './EditPaymentLot/EditPaymentLotDialog';
import { baseUrls } from '../../../constants/urls';

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
    const disableButtons = Boolean(paymentLot.task);
    const userIds = [
        ...new Set(paymentLot.payments.map(payment => payment.user.id)),
    ].join(',');
    const paymentIds = [
        ...new Set(paymentLot.payments.map(payment => payment.id)),
    ].join(',');
    return (
        <>
            {paymentLot.can_see_change_requests && (
                <IconButton
                    icon="remove-red-eye"
                    url={`/${baseUrls.orgUnitsChangeRequest}/userIds/${userIds}/paymentIds/${paymentIds}`}
                    tooltipMessage={MESSAGES.viewChangeRequestforLot}
                    disabled={disableButtons}
                />
            )}

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
            {!disableButtons && (
                <ExternalLinkIconButton
                    tooltipMessage={MESSAGES.download_payments}
                    overrideIcon={FileDownloadIcon}
                    url={`/api/payments/lots/${paymentLot.id}/?xlsx=true`}
                />
            )}
        </>
    );
};
