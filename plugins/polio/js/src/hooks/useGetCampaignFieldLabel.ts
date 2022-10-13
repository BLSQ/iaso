/* eslint-disable no-unused-vars */
// @ts-ignore

import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../constants/messages';

export const useGetCampaignFieldLabel = (): ((fieldKey: string) => string) => {
    const { formatMessage } = useSafeIntl();
    const getLabel = (fieldKey): any => {
        // temporary displaying key instead of label not yet added to translations
        return formatMessage(MESSAGES[fieldKey]) || fieldKey;
    };

    return getLabel;
};
