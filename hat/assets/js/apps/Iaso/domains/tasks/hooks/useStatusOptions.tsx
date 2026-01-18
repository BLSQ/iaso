import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { DropdownOptions } from '../../../types/utils';
import MESSAGES from '../messages';

export const useStatusOptions = (): DropdownOptions<string>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            'RUNNING',
            'QUEUED',
            'SUCCESS',
            'KILLED',
            'SKIPPED',
            'EXPORTED',
            'ERRORED',
        ].map(status => ({
            label: formatMessage(MESSAGES[status.toLowerCase()]),
            value: status,
        }));
    }, [formatMessage]);
};
