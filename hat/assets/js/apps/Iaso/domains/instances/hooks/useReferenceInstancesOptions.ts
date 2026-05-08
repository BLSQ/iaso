import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

export const useReferenceInstancesOptions = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                value: 'all',
                label: formatMessage(MESSAGES.referenceInstancesAll),
            },
            {
                value: 'reference',
                label: formatMessage(MESSAGES.referenceInstancesOnlyReference),
            },
            {
                value: 'not_reference',
                label: formatMessage(MESSAGES.referenceInstancesNotReference),
            },
        ],
        [formatMessage],
    );
};
