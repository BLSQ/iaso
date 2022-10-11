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
        // temporary displaying key instead of label not yet added to translations
        return formatMessage(messages[fieldKey]) || fieldKey;
    };

    return getLabel;
};
