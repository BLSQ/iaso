import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';
export const publishingStatuses = ['all', 'published', 'draft'];

export const endpoint = '/api/microplanning/plannings/';

export const useGetPublishingStatusOptions = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                label: formatMessage(MESSAGES.published),
                value: 'published',
            },
            {
                label: formatMessage(MESSAGES.draft),
                value: 'draft',
            },
        ],
        [formatMessage],
    );
};
