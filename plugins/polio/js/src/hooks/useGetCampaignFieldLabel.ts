/* eslint-disable no-unused-vars */
// @ts-ignore

import { useSafeIntl } from 'bluesquare-components';

import { Translations } from '../constants/types';

export const useGetCampaignFieldLabel = (): ((
    fieldKey: string,
    messages: Translations,
) => string) => {
    const { formatMessage } = useSafeIntl();
    const getLabel = (fieldKey, messages): any => {
        if (!messages[fieldKey]) {
            const field = Object.entries(messages).find(message =>
                message.filter(obj => obj.key === fieldKey),
            );

            console.log('field', field);
            return formatMessage(messages[field[0]]);
        }

        return formatMessage(messages[fieldKey]);
    };

    return getLabel;
};
