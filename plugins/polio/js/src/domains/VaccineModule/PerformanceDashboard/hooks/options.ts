import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../messages';
import { defaultVaccineOptions } from '../../SupplyChain/constants'; // New import

const statuses: string[] = ['draft', 'commented', 'final'];
// Removed: const vaccines: string[] = ['nOPV2', 'bOPV', 'nOPV2 & bOPV'];

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

export const useVaccineOptions = (): DropdownOptions<string>[] => {
    return defaultVaccineOptions.filter(option => option.value !== 'mOPV2');
};
