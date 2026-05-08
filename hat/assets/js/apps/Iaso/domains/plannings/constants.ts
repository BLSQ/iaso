import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';
export const publishingStatuses = ['all', 'published', 'draft'];

export const PLANNINGS_API_URL = '/api/microplanning/plannings/';
export const SAMPLINGS_API_URL = '/api/microplanning/samplings/';

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
