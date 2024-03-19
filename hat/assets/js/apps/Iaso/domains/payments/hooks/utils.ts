import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { paymentStatuses } from '../constant';
import { PaymentStatus } from '../types';
import { DropdownOptions } from '../../../types/utils';
import MESSAGES from '../messages';

export const usePaymentStatusOptions = (): DropdownOptions<PaymentStatus>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return paymentStatuses.map((status: PaymentStatus) => {
            return {
                value: status,
                label: MESSAGES[status]
                    ? formatMessage(MESSAGES[status])
                    : status,
            };
        });
    }, [formatMessage]);
};
