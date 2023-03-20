/* eslint-disable no-unused-vars */
// @ts-ignore

import { useSafeIntl } from 'bluesquare-components';
import { IntlMessage } from '../../../../../hat/assets/js/apps/Iaso/types/intl';

import MESSAGES from '../constants/messages';

export const useGetCampaignFieldLabel = (): ((fieldKey: string) => string) => {
    const { formatMessage } = useSafeIntl();
    const getLabel = (fieldKey): any => {
        // temporary displaying key instead of label not yet added to translations
        return formatMessage(MESSAGES[fieldKey]) || fieldKey;
    };

    return getLabel;
};

export const useGetChildrenLabel = (): ((
    childrenLabel: IntlMessage,
) => string) => {
    const { formatMessage } = useSafeIntl();
    const getLabel = (childrenLabel): string => {
        return formatMessage(childrenLabel);
    };

    return getLabel;
};
