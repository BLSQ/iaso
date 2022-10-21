// @ts-ignore
import { QueryBuilderFields } from 'bluesquare-components';

import { useGetPossibleFields } from '../../forms/hooks/useGetPossibleFields';
import { formatLabel } from '../utils';

import { FormDescriptor } from '../../forms/types/forms';
import { getLocaleDateFormat } from '../../../utils/dates';

const findDescriptorInChildren = (field, descriptor) =>
    descriptor?.children?.reduce((a, child) => {
        if (a) return a;
        if (child.name === field.name) return child;
        if (child.children) return findDescriptorInChildren(field, child);
        return undefined;
    }, null);

// you can fields examples here: https://codesandbox.io/s/github/ukrbublik/react-awesome-query-builder/tree/master/sandbox?file=/src/demo/config.tsx:1444-1464
export const useGetQueryBuildersFields = (
    formId?: number,
    formDescriptor?: FormDescriptor,
): QueryBuilderFields => {
    const { possibleFields, isFetchingForm } = useGetPossibleFields(formId);
    if (isFetchingForm || !possibleFields) return {};
    const Fields: QueryBuilderFields = {};
    possibleFields.forEach(field => {
        switch (field.type) {
            case 'text':
            case 'note': {
                Fields[field.name] = {
                    label: formatLabel(field),
                    type: 'text',
                    excludeOperators: [
                        'proximity',
                        'ends_with',
                        'starts_with',
                        'like',
                        'not_like',
                        'is_empty',
                        'is_not_empty',
                    ],
                };
                break;
            }
            case 'select_one':
            case 'select one': {
                const listValues =
                    findDescriptorInChildren(
                        field,
                        formDescriptor,
                    )?.children?.map(child => ({
                        value: child.name,
                        title: formatLabel(child),
                    })) || [];
                Fields[field.name] = {
                    label: formatLabel(field),
                    type: 'select',
                    excludeOperators: [
                        'proximity',
                        'select_any_in',
                        'select_not_any_in',
                    ],
                    valueSources: ['value'],
                    fieldSettings: {
                        listValues,
                    },
                };
                break;
            }
            case 'select multiple':
            case 'select_multiple': {
                const listValues =
                    findDescriptorInChildren(
                        field,
                        formDescriptor,
                    )?.children?.map(child => ({
                        value: child.name,
                        title: formatLabel(child),
                    })) || [];
                Fields[field.name] = {
                    label: formatLabel(field),
                    type: 'multiselect',
                    excludeOperators: [
                        'proximity',
                        'select_any_in',
                        'select_not_any_in',
                    ],
                    valueSources: ['value'],
                    fieldSettings: {
                        listValues,
                    },
                };
                break;
            }
            case 'integer':
            case 'decimal': {
                Fields[field.name] = {
                    label: formatLabel(field),
                    type: 'number',
                    preferWidgets: ['number'],
                };
                break;
            }
            case 'range': {
                Fields[field.name] = {
                    label: formatLabel(field),
                    type: 'number',
                    preferWidgets: ['number'],
                    operators: ['between'],
                    defaultOperator: 'between',
                };
                break;
            }
            case 'date': {
                Fields[field.name] = {
                    label: formatLabel(field),
                    type: 'date',
                    operators: ['equal', 'not_equal'],
                    fieldSettings: {
                        dateFormat: getLocaleDateFormat('L'),
                    },
                };
                break;
            }
            case 'time': {
                Fields[field.name] = {
                    label: formatLabel(field),
                    type: 'time',
                    operators: ['equal', 'not_equal'],
                    fieldSettings: {
                        timeFormat: getLocaleDateFormat('LT'),
                    },
                };
                break;
            }
            case 'dateTime': {
                Fields[field.name] = {
                    label: formatLabel(field),
                    type: 'datetime',
                    operators: ['equal', 'not_equal'],
                    fieldSettings: {
                        timeFormat: getLocaleDateFormat('LT'),
                        dateFormat: getLocaleDateFormat('L'),
                    },
                };
                break;
            }
            default:
                break;
        }
    });
    return Fields;
};
