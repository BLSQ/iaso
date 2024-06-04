import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { DropdownOptions } from '../../../../types/utils';

export const useInstancesOptions = (): DropdownOptions<
    'true' | 'false' | 'duplicates'
>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                label: formatMessage(MESSAGES.with),
                value: 'true',
            },
            {
                label: formatMessage(MESSAGES.without),
                value: 'false',
            },
            {
                label: formatMessage(MESSAGES.duplicates),
                value: 'duplicates',
            },
        ];
    }, [formatMessage]);
};
