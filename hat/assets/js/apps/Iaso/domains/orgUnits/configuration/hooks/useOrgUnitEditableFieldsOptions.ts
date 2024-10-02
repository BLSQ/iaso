import { useSafeIntl } from 'bluesquare-components';
import { editableFields } from '../constants';
import MESSAGES from '../messages';
import { DropdownOptions } from '../../../../types/utils';

export const useOrgUnitsEditableFieldsOptions =
    (): DropdownOptions<string>[] => {
        const { formatMessage } = useSafeIntl();
        return editableFields.map(field => {
            return {
                value: field,
                label: formatMessage(MESSAGES[field]),
            };
        });
    };
