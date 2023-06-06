// @ts-ignore
import { useSafeIntl, IntlFormatMessage } from 'bluesquare-components';
import { DropdownOptions } from '../../../types/utils';

import MESSAGES from '../messages';

export const useGetStatus = (): Array<DropdownOptions<string>> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return [
        {
            value: 'OK',
            label: formatMessage(MESSAGES.OK),
        },
        {
            value: 'BLACKLISTED',
            label: formatMessage(MESSAGES.BLACKLISTED),
        },
    ];
};
