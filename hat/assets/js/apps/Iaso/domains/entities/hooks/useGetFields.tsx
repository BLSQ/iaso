import { FormDescriptor, PossibleField } from '../../forms/types/forms';

import { formatLabel } from '../../instances/utils';
import { Entity } from '../types/entity';
import { Field } from '../types/fields';
import { useGetFieldValue } from './useGetFieldValue';

export const useGetFields = (
    fieldsKeys: string[],
    entity?: Entity,
    possibleFields?: PossibleField[],
    formDescriptors?: FormDescriptor[],
): Field[] => {
    const fields: Field[] = [];
    const getValue = useGetFieldValue(formDescriptors);
    if (possibleFields && entity?.attributes?.file_content) {
        const fileContent = entity.attributes.file_content;
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
