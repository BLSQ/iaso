import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

export const useGetValidationWorkflowInstanceStatuses = () => {
    const { formatMessage } = useSafeIntl();
    return {
        APPROVED: formatMessage(MESSAGES.statusApproved),
        REJECTED: formatMessage(MESSAGES.statusRejected),
        PENDING: formatMessage(MESSAGES.statusPending),
    };
};
