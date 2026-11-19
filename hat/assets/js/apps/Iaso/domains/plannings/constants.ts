import { useMemo } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import PublicIcon from '@mui/icons-material/Public';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';
import { Planning } from './types';
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
                icon: PublicIcon,
            },
            {
                label: formatMessage(MESSAGES.draft),
                value: 'draft',
                icon: EditIcon,
            },
        ],
        [formatMessage],
    );
};

export const getPublishingStatus = (planning: Planning) =>
    planning.published_at ? 'published' : 'draft';
