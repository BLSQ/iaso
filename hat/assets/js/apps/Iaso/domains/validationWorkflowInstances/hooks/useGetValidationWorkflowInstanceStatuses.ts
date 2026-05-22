import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

export const useGetValidationWorkflowInstanceStatuses = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                value: 'APPROVED',
                label: formatMessage(MESSAGES.statusApproved),
            },
            {
                value: 'REJECTED',
                label: formatMessage(MESSAGES.statusRejected),
            },
            {
                value: 'PENDING',
                label: formatMessage(MESSAGES.statusPending),
            },
        ],
        [formatMessage],
    );
};
