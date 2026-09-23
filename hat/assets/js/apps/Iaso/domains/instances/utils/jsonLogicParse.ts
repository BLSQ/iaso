import { QueryBuilderFields } from 'bluesquare-components';
import moment, { MomentInput } from 'moment';

import {
    apiDateFormat,
    apiDateTimeFormat,
    apiTimeFormat,
} from '../../../utils/dates';

type FieldType =
    | 'text'
    | 'select'
    | 'multiselect'
    | 'number'
    | 'time'
    | 'date'
    | 'datetime';

type Props = {
    // Date can appear at runtime from the query builder before serialization
    value: JSONValue | Date;
    parent?: JSONValue;
    fields: QueryBuilderFields;
};

export type JSONValue = string | number | boolean | JSONObject | JSONArray;

interface JSONObject {
    [x: string]: JSONValue;
}

type JSONArray = Array<JSONValue>;

type QueryBuilderFieldWithSubfields = {
    type?: string;
    subfields?: QueryBuilderFields;
};

const objectLoop = (
    obj: JSONObject,
    fields: QueryBuilderFields,
): JSONObject => {
    const newObj = {};
    Object.entries(obj).forEach(([key, value]: [string, JSONValue]) => {
        newObj[key] = parseJson({ value, parent: obj, fields });
    });
    return newObj;
};

const arrayLoop = (arr: JSONArray, fields: QueryBuilderFields): JSONArray => {
    return arr.map(value => parseJson({ value, parent: arr, fields }));
};

const findField = (
    fields: QueryBuilderFields,
    fieldName: string,
): QueryBuilderFieldWithSubfields | undefined => {
    const directField = fields[fieldName] as
        | QueryBuilderFieldWithSubfields
        | undefined;
    if (directField) {
        return directField;
    }
    return Object.values(fields).reduce<
        QueryBuilderFieldWithSubfields | undefined
    >((found, field) => {
        if (found) {
            return found;
        }
        const fieldWithSubfields = field as QueryBuilderFieldWithSubfields;
        if (fieldWithSubfields?.subfields) {
            return findField(fieldWithSubfields.subfields, fieldName);
        }
        return undefined;
    }, undefined);
};

const getFieldType = (
    fields: QueryBuilderFields,
    parent?: JSONValue,
): FieldType | undefined => {
    const varName = Array.isArray(parent)
        ? (parent[0] as { var?: string } | undefined)?.var
        : undefined;
    if (!varName) {
        return undefined;
    }
    return findField(fields, varName)?.type as FieldType | undefined;
};

const formatDateValue = (
    value: MomentInput,
    fieldType: FieldType | undefined,
): string => {
    if (fieldType === 'datetime') {
        return moment(value).format(apiDateTimeFormat);
    }
    return moment(value).format(apiDateFormat);
};

export const parseJson = ({ value, parent, fields }: Props): JSONValue => {
    // Date objects must be handled before the generic object loop, otherwise
    // Object.entries(date) yields {} and the value is lost.
    if (value instanceof Date) {
        return formatDateValue(value, getFieldType(fields, parent));
    }
    // @ts-ignore
    if (value && !value.var) {
        const fieldType = getFieldType(fields, parent);
        if (fieldType === 'date') {
            if (value === 'current_time') {
                return value;
            }
            return formatDateValue(value as MomentInput, 'date');
        }
        if (fieldType === 'datetime') {
            if (value === 'current_time') {
                return value;
            }
            return formatDateValue(value as MomentInput, 'datetime');
        }
        if (fieldType === 'time') {
            return `${moment
                .utc(
                    moment
                        .duration(value as string, 'seconds')
                        .as('milliseconds'),
                )
                .format(apiTimeFormat)}`;
        }
    }
    if (Array.isArray(value)) {
        return arrayLoop(value as JSONArray, fields);
    }
    if (value && typeof value === 'object') {
        return objectLoop(value as JSONObject, fields);
    }

    return value as JSONValue;
};
