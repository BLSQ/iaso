import { useSafeIntl, IntlFormatMessage } from 'bluesquare-components';
import { DropdownOptions } from 'Iaso/types/utils';

import MESSAGES from '../messages';

export const useGetImpacts = (): Array<DropdownOptions<string>> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return [
        {
            value: 'ADD',
            label: formatMessage(MESSAGES.add),
        },
        {
            value: 'SUBTRACT',
            label: formatMessage(MESSAGES.subtract),
        },
        {
            value: 'RESET',
            label: formatMessage(MESSAGES.reset),
        },
    ];
};
