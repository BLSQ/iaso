import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { DropdownOptions } from '../../../../types/utils';
import MESSAGES from '../../messages';

export const useLocationOptions = (): DropdownOptions<'true' | 'false'>[] => {
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
        ];
    }, [formatMessage]);
};
