import moment from 'moment';
import { apiDateFormat, apiDateTimeFormat } from '../../../utils/dates';
import { parseJson } from './jsonLogicParse';

describe('parseJson', () => {
    const flatFields = {
        TEST_DATE: { type: 'date', label: 'Test date' },
        TEST_DATETIME: { type: 'datetime', label: 'Test datetime' },
    };

    const nestedFields = {
        form_abc: {
            type: '!group',
            label: 'Form',
            subfields: flatFields,
        },
    };

    it('formats date values for flat fields', () => {
        const date = new Date('2026-08-12T00:00:00.000Z');
        const logic = {
            and: [
                {
                    '==': [{ var: 'TEST_DATE' }, date],
                },
            ],
        };
        const result = parseJson({ value: logic as any, fields: flatFields });
        expect(result).toEqual({
            and: [
                {
                    '==': [
                        { var: 'TEST_DATE' },
                        moment(date).format(apiDateFormat),
                    ],
                },
            ],
        });
    });

    it('formats date values nested under group subfields (entities query builder)', () => {
        const date = new Date('2026-08-12T00:00:00.000Z');
        const logic = {
            some: [
                { var: 'form_abc' },
                {
                    and: [
                        {
                            '==': [{ var: 'TEST_DATE' }, date],
                        },
                    ],
                },
            ],
        };
        const result = parseJson({
            value: logic as any,
            fields: nestedFields as any,
        });
        expect(result).toEqual({
            some: [
                { var: 'form_abc' },
                {
                    and: [
                        {
                            '==': [
                                { var: 'TEST_DATE' },
                                moment(date).format(apiDateFormat),
                            ],
                        },
                    ],
                },
            ],
        });
    });

    it('formats datetime values nested under group subfields', () => {
        const date = new Date('2026-08-12T14:30:00.000Z');
        const logic = {
            some: [
                { var: 'form_abc' },
                {
                    and: [
                        {
                            '==': [{ var: 'TEST_DATETIME' }, date],
                        },
                    ],
                },
            ],
        };
        const result = parseJson({
            value: logic as any,
            fields: nestedFields as any,
        });
        expect(result).toEqual({
            some: [
                { var: 'form_abc' },
                {
                    and: [
                        {
                            '==': [
                                { var: 'TEST_DATETIME' },
                                moment(date).format(apiDateTimeFormat),
                            ],
                        },
                    ],
                },
            ],
        });
    });

    it('does not turn Date objects into empty objects when field type is unknown', () => {
        const date = new Date('2026-08-12T00:00:00.000Z');
        const logic = {
            and: [{ '==': [{ var: 'UNKNOWN' }, date] }],
        };
        const result = parseJson({ value: logic as any, fields: flatFields });
        expect(result).toEqual({
            and: [
                {
                    '==': [
                        { var: 'UNKNOWN' },
                        moment(date).format(apiDateFormat),
                    ],
                },
            ],
        });
    });
});
