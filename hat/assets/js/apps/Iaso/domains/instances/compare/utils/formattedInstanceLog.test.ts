import { describe, expect, it } from 'vitest';
import {
    EMPTY_FORMATTED_INSTANCE_LOG,
    hasInstanceLogContent,
} from './formattedInstanceLog';

describe('hasInstanceLogContent', () => {
    it('returns false for null', () => {
        expect(hasInstanceLogContent(null)).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(hasInstanceLogContent(undefined)).toBe(false);
    });

    it('returns true for empty formatted log shell objects', () => {
        // Empty objects in logA/logB/logAFiles/logBFiles are truthy in JS
        expect(hasInstanceLogContent(EMPTY_FORMATTED_INSTANCE_LOG)).toBe(true);
    });

    it('returns false when all content fields are empty or missing', () => {
        expect(
            hasInstanceLogContent({
                logA: undefined,
                logB: undefined,
                logAFiles: undefined,
                logBFiles: undefined,
                fields: [],
            }),
        ).toBe(false);
    });

    it('returns true when logA has content', () => {
        expect(
            hasInstanceLogContent({
                ...EMPTY_FORMATTED_INSTANCE_LOG,
                logA: { json: { field: 'value' } },
            }),
        ).toBe(true);
    });

    it('returns true when logB has content', () => {
        expect(
            hasInstanceLogContent({
                ...EMPTY_FORMATTED_INSTANCE_LOG,
                logB: { json: { field: 'value' } },
            }),
        ).toBe(true);
    });

    it('returns true when fields has entries', () => {
        expect(
            hasInstanceLogContent({
                ...EMPTY_FORMATTED_INSTANCE_LOG,
                fields: [{ name: 'field_a' }],
            }),
        ).toBe(true);
    });

    it('returns true when logAFiles has content', () => {
        expect(
            hasInstanceLogContent({
                ...EMPTY_FORMATTED_INSTANCE_LOG,
                logAFiles: { file1: 'url' },
            }),
        ).toBe(true);
    });
});
