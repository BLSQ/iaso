import { describe, expect, it } from 'vitest';
import {
    buildQuestionMapping,
    ORG_UNIT_IASO_FIELD,
    VALUE_FROM_FORM,
} from './utils';

const aggregateElement = { id: 'deBelgium', valueType: 'NUMBER' };
const facility = {
    dataElement: { id: 'deFacility', valueType: 'ORGANISATION_UNIT' },
};
const weight = { dataElement: { id: 'deWeight', valueType: 'NUMBER' } };

describe('buildQuestionMapping', () => {
    it('keeps an aggregate mapping as is, ignoring the instance property', () => {
        expect(
            buildQuestionMapping(
                aggregateElement,
                'AGGREGATE',
                ORG_UNIT_IASO_FIELD,
            ),
        ).toBe(aggregateElement);
    });

    it('wraps a tracker mapping in a list, taking the answer from the form', () => {
        expect(
            buildQuestionMapping(facility, 'EVENT_TRACKER', VALUE_FROM_FORM),
        ).toEqual([facility]);
    });

    it('adds the instance org unit to an org unit element', () => {
        expect(
            buildQuestionMapping(
                facility,
                'EVENT_TRACKER',
                ORG_UNIT_IASO_FIELD,
            ),
        ).toEqual([{ ...facility, iaso_field: ORG_UNIT_IASO_FIELD }]);
    });

    it('ignores an instance property left selected for another value type', () => {
        expect(
            buildQuestionMapping(weight, 'EVENT_TRACKER', ORG_UNIT_IASO_FIELD),
        ).toEqual([weight]);
    });
});
