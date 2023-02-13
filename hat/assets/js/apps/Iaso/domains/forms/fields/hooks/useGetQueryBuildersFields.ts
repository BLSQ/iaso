import { QueryBuilderFields } from 'bluesquare-components';

import { formatLabel } from '../../../instances/utils';

import { FormDescriptor, PossibleField } from '../../types/forms';

import { iasoFields, Field } from '../constants';

const findDescriptorInChildren = (field, descriptor) =>
    descriptor?.children?.reduce((a, child) => {
        if (a) return a;
        if (child.name === field.name) return child;
        if (child.children) return findDescriptorInChildren(field, child);
        return undefined;
    }, null);

export const useGetQueryBuildersFields = (
    formDescriptors?: FormDescriptor[],
    possibleFields?: PossibleField[],
): QueryBuilderFields => {
    if (!possibleFields) return {};
    // you can fields examples here: https://codesandbox.io/s/github/ukrbublik/react-awesome-query-builder/tree/master/sandbox?file=/src/demo/config.tsx:1444-1464
    const fields: QueryBuilderFields = {};
    possibleFields.forEach(field => {
        const currentField: Field | undefined = iasoFields.find(
            iasoField =>
                iasoField.type === field.type || iasoField.alias === field.type,
        );
        if (
            currentField &&
            !currentField.disabled &&
            currentField.queryBuilder
        ) {
            fields[field.fieldKey] = {
                ...currentField.queryBuilder,
                label: formatLabel(field),
            };
            // in case the field needs a list of values to display
            if (currentField.useListValues) {
                // We will take the last found value in the form descriptors list
                formDescriptors?.forEach(formDescriptor => {
                    const listValues =
                        findDescriptorInChildren(
                            field,
                            formDescriptor,
                        )?.children?.map(child => ({
                            value: child.name,
                            title: formatLabel(child),
                        })) || [];
                    fields[field.fieldKey].fieldSettings = {
                        listValues,
                    };
                });
            }
        }
    });
    return fields;
};
