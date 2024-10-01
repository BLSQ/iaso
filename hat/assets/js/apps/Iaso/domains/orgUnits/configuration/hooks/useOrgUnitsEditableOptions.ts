import { useSafeIntl } from 'bluesquare-components';
import { DropdownOptions } from '../../../../types/utils';
import MESSAGES from '../messages';

export const useOrgUnitsEditableOptions = (): DropdownOptions<boolean>[] => {
    const { formatMessage } = useSafeIntl();
    return [
        {
            label: formatMessage(MESSAGES.orgUnitsEditableYes),
            value: true,
        },
        {
            label: formatMessage(MESSAGES.orgUnitsEditableNo),
            value: false,
        },
    ];
};
