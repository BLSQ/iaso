import {
    // @ts-ignore
    QueryBuilderFields,
    // @ts-ignore
    QueryBuilderListToReplace,
} from 'bluesquare-components';
import { purple, blue } from '@material-ui/core/colors';

import { formatLabel } from '../../instances/utils';

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
    formDescriptors?: FormDescriptor[],
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
                let listValues = [];
                formDescriptors?.forEach(formDescriptor => {
                    const desc = findDescriptorInChildren(
                        field,
                        formDescriptor,
                    );
                    if (desc?.children) {
                        listValues = desc.children.map(child => ({
                            value: child.name,
                            title: formatLabel(child),
                        }));
                    }
                });
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
            case 'integer':
            case 'decimal': {
                Fields[field.fieldKey] = {
                    label: formatLabel(field),
                    type: 'number',
                    excludeOperators: ['between'],
                    preferWidgets: ['number'],
                };
                break;
            }
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
                items: [
                    '=',
                    '!=',
                    'IS NULL',
                    'IS NOT NULL',
                    '>',
                    '<',
                    '>=',
                    '<=',
                ],
            },
        ];
    };
