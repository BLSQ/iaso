import {
    // @ts-ignore
    QueryBuilderFields,
    // @ts-ignore
    QueryBuilderListToReplace,
} from 'bluesquare-components';
import { purple, blue } from '@material-ui/core/colors';

import { formatLabel } from '../utils';

import { FormDescriptor, PossibleField } from '../../forms/types/forms';
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
    formDescriptor?: FormDescriptor,
    possibleFields?: PossibleField[],
): QueryBuilderFields => {
    if (!possibleFields) return {};
    const Fields: QueryBuilderFields = {};
    possibleFields.forEach(field => {
        switch (field.type) {
            case 'text':
            case 'note': {
                Fields[field.fieldKey] = {
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
                Fields[field.fieldKey] = {
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
            // Not working for now
            // case 'select multiple':
            // case 'select_multiple': {
            //     const listValues =
            //         findDescriptorInChildren(
            //             field,
            //             formDescriptor,
            //         )?.children?.map(child => ({
            //             value: child.name,
            //             title: formatLabel(child),
            //         })) || [];
            //     Fields[field.fieldKey] = {
            //         label: formatLabel(field),
            //         originalKey: field.name,
            //         type: 'multiselect',
            //         excludeOperators: [
            //             'proximity',
            //             'select_any_in',
            //             'select_not_any_in',
            //         ],
            //         valueSources: ['value'],
            //         fieldSettings: {
            //             listValues,
            //         },
            //     };
            //     break;
            // }
            case 'integer':
            case 'decimal': {
                Fields[field.fieldKey] = {
                    label: formatLabel(field),
                    type: 'number',
                    operators: ['equal', 'not_equal'],
                    preferWidgets: ['number'],
                };
                break;
            }
            // case 'range': {
            //     Fields[field.fieldKey] = {
            //         label: formatLabel(field),
            //         type: 'number',
            //         preferWidgets: ['number'],
            //         operators: ['between'],
            //         defaultOperator: 'between',
            //     };
            //     break;
            // }
            case 'date': {
                Fields[field.fieldKey] = {
                    label: formatLabel(field),
                    type: 'date',
                    operators: ['equal', 'not_equal'],
                    fieldSettings: {
                        dateFormat: getLocaleDateFormat('L'),
                    },
                };
                break;
            }

            // Not working for now
            // case 'time': {
            //     Fields[field.fieldKey] = {
            //         label: formatLabel(field),
            //         type: 'time',
            //         originalKey: field.name,
            //         operators: ['equal', 'not_equal'],
            //         fieldSettings: {
            //             timeFormat: getLocaleDateFormat('LT'),
            //         },
            //     };
            //     break;
            // }
            // case 'dateTime': {
            //     Fields[field.fieldKey] = {
            //         label: formatLabel(field),
            //         type: 'datetime',
            //         originalKey: field.name,
            //         operators: ['equal', 'not_equal'],
            //         fieldSettings: {
            //             timeFormat: getLocaleDateFormat('LT'),
            //             dateFormat: getLocaleDateFormat('L'),
            //         },
            //     };
            //     break;
            // }
            default:
                break;
        }
    });
    return Fields;
};

export const useGetQueryBuilderListToReplace =
    (): QueryBuilderListToReplace[] => {
        return [
            {
                color: purple[700],
                items: ['AND', 'OR'],
            },
            {
                color: blue[700],
                items: ['=', '!=', 'IS NULL', 'IN NOT NULL'],
            },
        ];
    };
