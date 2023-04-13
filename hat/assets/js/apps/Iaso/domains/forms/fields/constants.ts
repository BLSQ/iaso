import { QueryBuilderField } from 'bluesquare-components';

import { getLocaleDateFormat } from '../../../utils/dates';
import { FieldType } from '../types/forms';

export type Field = {
    type: FieldType;
    queryBuilder?: QueryBuilderField; // this one should be set if not disabled
    alias?: string;
    disabled?: boolean;
    useListValues?: boolean;
};

export const xlsQuestionsTypesLink = 'https://xlsform.org/en/#question-types';

export const iasoFields: Field[] = [
    {
        type: 'text',
        queryBuilder: {
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
        },
    },
    {
        type: 'note',
        queryBuilder: {
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
        },
    },
    {
        type: 'integer',
        queryBuilder: {
            type: 'number',
            operators: ['equal', 'not_equal'],
            preferWidgets: ['number'],
        },
    },
    {
        type: 'decimal',
        queryBuilder: {
            type: 'number',
            operators: ['equal', 'not_equal'],
            preferWidgets: ['number'],
        },
    },
    {
        type: 'select_one',
        alias: 'select one',
        useListValues: true,
        queryBuilder: {
            type: 'select',
            excludeOperators: [
                'proximity',
                'select_any_in',
                'select_not_any_in',
            ],
            valueSources: ['value'],
        },
    },
    {
        type: 'date',
        queryBuilder: {
            type: 'date',
            operators: ['equal', 'not_equal'],
            preferWidgets: ['number'],
            fieldSettings: {
                dateFormat: getLocaleDateFormat('L'),
            },
        },
    },
    {
        type: 'select_multiple',
        alias: 'select multiple',
        disabled: true,
        useListValues: true,
        queryBuilder: {
            type: 'multiselect',
            excludeOperators: [
                'proximity',
                'select_any_in',
                'select_not_any_in',
            ],
            valueSources: ['value'],
        },
    },
    {
        type: 'time',
        queryBuilder: {
            type: 'time',
            operators: ['equal', 'not_equal'],
            fieldSettings: {
                timeFormat: getLocaleDateFormat('LT'),
            },
        },
    },
    {
        type: 'dateTime',
        queryBuilder: {
            type: 'datetime',
            operators: ['equal', 'not_equal'],
            fieldSettings: {
                timeFormat: getLocaleDateFormat('LT'),
                dateFormat: getLocaleDateFormat('L'),
            },
        },
    },
    {
        type: 'range',
        disabled: true,
    },
    {
        type: 'select_one_from_file',
        disabled: true,
    },
    {
        type: 'select_multiple_from_file',
        disabled: true,
    },
    {
        type: 'rank',
        disabled: true,
    },
    {
        type: 'rank',
        disabled: true,
    },
    {
        type: 'geopoint',
        disabled: true,
    },
    {
        type: 'geotrace',
        disabled: true,
    },
    {
        type: 'geoshape',
        disabled: true,
    },
    {
        type: 'start',
        disabled: true,
    },
    {
        type: 'end',
        disabled: true,
    },
    {
        type: 'image',
        disabled: true,
    },
    {
        type: 'audio',
        disabled: true,
    },
    {
        type: 'background-audio',
        disabled: true,
    },
    {
        type: 'video',
        disabled: true,
    },
    {
        type: 'file',
        disabled: true,
    },
    {
        type: 'barcode',
        disabled: true,
    },
    {
        type: 'calculate',
        disabled: true,
    },
    {
        type: 'acknowledge',
        disabled: true,
    },
    {
        type: 'hidden',
        disabled: true,
    },
    {
        type: 'xml-external',
        disabled: true,
    },
];
