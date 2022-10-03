// @ts-ignore
import { QueryBuilderFields } from 'bluesquare-components';
import { useGetPossibleFields } from '../../forms/hooks/useGetPossibleFields';
import { formatLabel } from '../utils';
// you can fields examples here: https://codesandbox.io/s/github/ukrbublik/react-awesome-query-builder/tree/master/sandbox?file=/src/demo/config.tsx:1444-1464
export const useGetQueryBuildersFields = (
    formId?: number,
): QueryBuilderFields => {
    const { possibleFields, isFetchingForm } = useGetPossibleFields(formId);
    if (isFetchingForm || !possibleFields) return {};
    const Fields: QueryBuilderFields = {};
    possibleFields.forEach(field => {
        switch (field.type) {
            case 'text':
            case 'note':
            case 'select_one': // TODO: use select field for this, need to have list of possible fields
            case 'select one':
            case 'select multiple':
            case 'select_multiple': {
                Fields[field.name] = {
                    label: formatLabel(field),
                    type: 'text',
                    excludeOperators: ['proximity'], // TODO: check qith backen if proximity is working
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
                };
                break;
            }
            case 'time': {
                Fields[field.name] = {
                    label: formatLabel(field),
                    type: 'time',
                };
                break;
            }
            case 'dateTime': {
                Fields[field.name] = {
                    label: formatLabel(field),
                    type: 'datetime',
                };
                break;
            }
            default:
                break;
        }
    });
    return Fields;
};
