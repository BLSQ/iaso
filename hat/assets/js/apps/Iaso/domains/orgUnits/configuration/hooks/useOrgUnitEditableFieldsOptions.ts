import { useSafeIntl } from 'bluesquare-components';
import { DropdownOptions } from '../../../../types/utils';
import { editableFields } from '../constants';
import MESSAGES from '../messages';

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
