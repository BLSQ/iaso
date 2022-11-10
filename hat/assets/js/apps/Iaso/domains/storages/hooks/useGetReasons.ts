// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { IntlFormatMessage } from '../../../types/intl';

import { DropdownOptions } from '../../../types/utils';

import MESSAGES from '../messages';

export const useGetReasons = (): Array<DropdownOptions<string>> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return [
        {
            value: 'STOLEN',
            label: formatMessage(MESSAGES.stolen),
        },
        {
            value: 'LOST',
            label: formatMessage(MESSAGES.lost),
        },
        {
            value: 'DAMAGED',
            label: formatMessage(MESSAGES.damaged),
        },
        {
            value: 'ABUSE',
            label: formatMessage(MESSAGES.abuse),
        },
        {
            value: 'OTHER',
            label: formatMessage(MESSAGES.other),
        },
    ];
};
