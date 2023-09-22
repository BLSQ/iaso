/* eslint-disable no-unused-vars */
import moment from 'moment';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';

import { CampaignFieldType } from '../constants/types';

import MESSAGES from '../constants/messages';

const textPlaceholder = '--';

export const useGetCampaignFieldValue = (): ((
    fieldKey: string,
    type: CampaignFieldType,
) => string) => {
    const { formatMessage } = useSafeIntl();
    const getValue = (value, type): string => {
        if (!value) return textPlaceholder;
        switch (type) {
            case 'string':
            case 'number': {
                return value || textPlaceholder;
            }
            case 'date': {
                return value ? moment(value).format('L') : textPlaceholder;
            }
            case 'boolean': {
                return value.toString();
            }
            case 'dateTime': {
                return value ? moment(value).format('LTS') : textPlaceholder;
            }
            case 'time': {
                return value ? moment(value).format('T') : textPlaceholder;
            }
            default:
                console.warn('value', value);
                return formatMessage(MESSAGES.typeNotSupported, { type });
        }
    };
    return getValue;
};
