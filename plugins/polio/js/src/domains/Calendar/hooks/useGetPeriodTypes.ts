import { useSafeIntl } from 'bluesquare-components';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../../../constants/messages';

export const useGetPeriodTypes = (): DropdownOptions<string>[] => {
    const { formatMessage } = useSafeIntl();
    return [
        {
            label: formatMessage(MESSAGES.semester),
            value: 'semester',
        },
        {
            label: formatMessage(MESSAGES.quarter),
            value: 'quarter',
        },
        {
            label: formatMessage(MESSAGES.year),
            value: 'year',
        },
    ];
};
