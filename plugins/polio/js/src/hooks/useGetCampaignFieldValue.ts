/* eslint-disable no-unused-vars */
import moment from 'moment';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';

import { CampaignLogData, CampaignFieldType } from '../constants/types';

import MESSAGES from '../constants/messages';

const textPlaceholder = '--';

export const useGetCampaignFieldValue = (): ((
    fieldKey: string,
    newValue: CampaignLogData,
    type: CampaignFieldType,
) => string) => {
    const { formatMessage } = useSafeIntl();
    const getValue = (fieldKey, newValue, type): string => {
        switch (type) {
            case 'object': {
                if (!newValue[fieldKey]) {
                    return textPlaceholder;
                }
                return 'boo';
            }
            case 'string':
            case 'number': {
                return newValue[fieldKey] || textPlaceholder;
            }
            case 'date': {
                return newValue[fieldKey]
                    ? moment(newValue[fieldKey]).format('L')
                    : textPlaceholder;
            }
            case 'boolean': {
                return newValue[fieldKey].toString();
            }
            case 'dateTime': {
                return newValue[fieldKey]
                    ? moment(newValue[fieldKey]).format('LTS')
                    : textPlaceholder;
            }
            case 'time': {
                return newValue[fieldKey]
                    ? moment(newValue[fieldKey]).format('T')
                    : textPlaceholder;
            }
            default:
                return formatMessage(MESSAGES.typeNotSupported, { type });
        }
    };
    return getValue;
};
