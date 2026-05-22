import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { DropdownOptions } from 'Iaso/types/utils';
import MESSAGES from '../../messages';
import { Criteria } from '../types';

export const useGetCriteriaOptions = (): DropdownOptions<Criteria>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                label: formatMessage(MESSAGES.ruralUrban),
                value: 'RURAL/URBAN',
            },
            {
                label: formatMessage(MESSAGES.urban),
                value: 'URBAN',
            },
            {
                label: formatMessage(MESSAGES.rural),
                value: 'RURAL',
            },
        ],
        [formatMessage],
    );
};
