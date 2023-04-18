import moment, { MomentInput } from 'moment';
// @ts-ignore
import { QueryBuilderFields } from 'bluesquare-components';

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
    value: JSONValue;
    parent?: JSONValue;
    fields: QueryBuilderFields;
};

export type JSONValue = string | number | boolean | JSONObject | JSONArray;

interface JSONObject {
    [x: string]: JSONValue;
}

type JSONArray = Array<JSONValue>;

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

const getFieldType = (
    fields: QueryBuilderFields,
    parent?: JSONValue,
): FieldType => parent && parent[0]?.var && fields[parent[0].var]?.type;

export const parseJson = ({ value, parent, fields }: Props): JSONValue => {
    // @ts-ignore
    if (value && !value.var) {
        const fieldType = getFieldType(fields, parent);
        if (fieldType === 'date') {
            if (value === 'current_time') {
                return value;
            }
            return moment(value as MomentInput).format(apiDateFormat);
        }
        if (fieldType === 'datetime') {
            if (value === 'current_time') {
                return value;
            }
            return moment(value as MomentInput).format(apiDateTimeFormat);
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
        return arrayLoop(value, fields);
    }
    if (value && typeof value === 'object') {
        return objectLoop(value, fields);
    }

    return value;
};
