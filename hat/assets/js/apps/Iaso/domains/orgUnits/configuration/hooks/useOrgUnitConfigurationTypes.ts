import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { DropdownOptions } from '../../../../types/utils';
import {
    orgUnitChangeRequestConfigTypeCreation,
    orgUnitChangeRequestConfigTypeEdition,
} from '../constants';
import MESSAGES from '../messages';

export const useOrgUnitConfigurationTypes = (): DropdownOptions<string>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                value: orgUnitChangeRequestConfigTypeCreation,
                label: formatMessage(MESSAGES.creation),
            },
            {
                value: orgUnitChangeRequestConfigTypeEdition,
                label: formatMessage(MESSAGES.edition),
            },
        ],
        [formatMessage],
    );
};
