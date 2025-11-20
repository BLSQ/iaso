import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../messages';

const statuses: string[] = ['draft', 'commented', 'final']; // Updated statuses
const antigens: string[] = ['nOPV2', 'bOPV', 'nOPV2 & bOPV'];

export const useStatusOptions = (): DropdownOptions<string>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return statuses.map(status => {
            return {
                value: status,
                // Assuming messages are like MESSAGES.draft, MESSAGES.commented, MESSAGES.final
                label: MESSAGES[status.toLowerCase()]
                    ? formatMessage(MESSAGES[status.toLowerCase()])
                    : status,
            };
        });
    }, [formatMessage]);
};

export const useAntigenOptions = (): DropdownOptions<string>[] => {
    return useMemo(() => {
        return antigens.map(antigen => {
            return {
                value: antigen,
                label: antigen,
            };
        });
    }, []);
};
