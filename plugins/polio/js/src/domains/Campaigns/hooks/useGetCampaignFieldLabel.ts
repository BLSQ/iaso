/* eslint-disable no-unused-vars */
// @ts-ignore

import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../../../constants/messages';

export const useGetCampaignFieldLabel = (): ((fieldKey: string) => string) => {
    const { formatMessage } = useSafeIntl();
    const WORKFLOW_SUFFIX = '_at_WFEDITABLE';

    const getLabel = (fieldKey): any => {
        if (fieldKey.includes(WORKFLOW_SUFFIX)) {
            const budgetFieldKey = fieldKey.replace(WORKFLOW_SUFFIX, '');
            return formatMessage(MESSAGES[budgetFieldKey]);
        }
        // temporary displaying key instead of label not yet added to translations
        return formatMessage(MESSAGES[fieldKey]) || fieldKey;
    };

    return getLabel;
};
