import { PossibleField } from '../../forms/types/forms';

import { useGetFieldValue } from './useGetFieldValue';

import { Beneficiary } from '../types/beneficiary';
import { Field } from '../types/fields';
import { formatLabel } from '../../instances/utils';

export const useGetFields = (
    fieldsKeys: string[],
    beneficiary?: Beneficiary,
    possibleFields?: PossibleField[],
): Field[] => {
    const fields: Field[] = [];
    const getValue = useGetFieldValue();
    if (possibleFields && beneficiary?.attributes?.file_content) {
        const fileContent = beneficiary.attributes.file_content;
        fieldsKeys.forEach(fieldKey => {
            const possibleField = possibleFields.find(
                pf => pf.name === fieldKey,
            );
            if (possibleField) {
                const value = getValue(
                    fieldKey,
                    fileContent,
                    possibleField.type,
                );
                fields.push({
                    value,
                    label: formatLabel(possibleField),
                    type: possibleField.type,
                    key: fieldKey,
                });
            }
        });
    }
    return fields;
};
