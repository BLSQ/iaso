import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import MESSAGES from '../../messages';
import { DropdownOptions } from '../../../../types/utils';

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
