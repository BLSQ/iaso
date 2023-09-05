import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../../../../constants/messages';
import { Nopv2AuthStatus } from '../types';

const statuses: Nopv2AuthStatus[] = [
    'ONGOING',
    'SIGNATURE',
    'VALIDATED',
    'EXPIRED',
];

export const useStatusOptions = (): DropdownOptions<string>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return statuses.map(status => {
            return {
                value: status,
                label: MESSAGES[status.toLowerCase()]
                    ? formatMessage(MESSAGES[status.toLowerCase()])
                    : status,
            };
        });
    }, [formatMessage]);
};
