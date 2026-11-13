import { describe, expect, it } from 'vitest';
import { isMapped, isNeverMapped } from './question_mappings';

describe('isNeverMapped', () => {
    it('is true for the neverMapped marker', () => {
        expect(isNeverMapped({ type: 'neverMapped' })).toBe(true);
    });

    it('is false when the mapping has a DHIS2 id', () => {
        expect(isNeverMapped({ id: 'de1', type: 'neverMapped' })).toBe(false);
    });

    it('is false for a normal data element mapping', () => {
        expect(isNeverMapped({ id: 'de1', valueType: 'NUMBER' })).toBe(false);
    });

    it('is false for tracker list mappings', () => {
        expect(isNeverMapped([{ dataElement: { id: 'de1' } }])).toBe(false);
    });

    it('is false for empty, null or undefined', () => {
        expect(isNeverMapped({})).toBe(false);
        expect(isNeverMapped(null)).toBe(false);
        expect(isNeverMapped(undefined)).toBe(false);
    });
});

describe('isMapped', () => {
    it('is true when the mapping has an id', () => {
        expect(isMapped({ id: 'de1' })).toBe(true);
    });

    it('is true for a non-empty tracker list', () => {
        expect(isMapped([{ dataElement: { id: 'de1' } }])).toBe(true);
    });

    it('is false for an empty tracker list', () => {
        expect(isMapped([])).toBe(false);
    });

    it('is false for the neverMapped marker', () => {
        expect(isMapped({ type: 'neverMapped' })).toBe(false);
    });

    it('is false for empty, null or undefined', () => {
        expect(isMapped({})).toBe(false);
        expect(isMapped(null)).toBe(false);
        expect(isMapped(undefined)).toBe(false);
    });
});
