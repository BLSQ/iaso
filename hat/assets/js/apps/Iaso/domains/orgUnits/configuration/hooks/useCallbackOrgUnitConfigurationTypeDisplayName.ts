import { useCallback } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import {
    orgUnitChangeRequestConfigTypeCreation,
    orgUnitChangeRequestConfigTypeEdition,
} from '../constants';
import MESSAGES from '../messages';

export const useCallbackOrgUnitConfigurationTypeDisplayName = () => {
    const { formatMessage } = useSafeIntl();
    return useCallback(
        (type: string): string => {
            switch (type) {
                case orgUnitChangeRequestConfigTypeCreation:
                    return formatMessage(MESSAGES.creation);
                case orgUnitChangeRequestConfigTypeEdition:
                    return formatMessage(MESSAGES.edition);
                default:
                    return '';
            }
        },
        [formatMessage],
    );
};
