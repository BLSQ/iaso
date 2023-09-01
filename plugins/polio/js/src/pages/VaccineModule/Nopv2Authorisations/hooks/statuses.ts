import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../../../../constants/messages';
import { Nopv2AuthStatus } from '../types';

const statuses: Nopv2AuthStatus[] = [
    'ongoing',
    'signature',
    'validated',
    'expired',
];

export const useStatusOptions = (): DropdownOptions<string>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return statuses.map(status => {
            return {
                value: status,
                label: formatMessage(MESSAGES[status]),
            };
        });
    }, [formatMessage]);
};
