import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';
export const publishingStatuses = ['all', 'published', 'draft'];

export const endpoint = '/api/microplanning/plannings/';

export const useGetPublishingStatusOptions = (hasStarted: boolean) => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                label: formatMessage(MESSAGES.published),
                value: 'published',
                disabled: hasStarted,
            },
            {
                label: formatMessage(MESSAGES.draft),
                value: 'draft',
                disabled: hasStarted,
            },
        ],
        [formatMessage, hasStarted],
    );
};
