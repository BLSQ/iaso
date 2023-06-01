// @ts-ignore
import { useSafeIntl, IntlFormatMessage } from 'bluesquare-components';
import { DropdownOptions } from '../../../types/utils';

import MESSAGES from '../messages';

export const useGetTypes = (): Array<DropdownOptions<string>> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return [
        {
            value: 'NFC',
            label: formatMessage(MESSAGES.nfc),
        },
        {
            value: 'USB',
            label: formatMessage(MESSAGES.usb),
        },
        {
            value: 'SD',
            label: formatMessage(MESSAGES.sd),
        },
    ];
};
