import { describe, expect, it } from 'vitest';
import { pickObjectEntriesByKeys } from './pickObjectEntriesByKeys';

describe('pickObjectEntriesByKeys', () => {
    it('keeps only keys in the allowlist', () => {
        expect(pickObjectEntriesByKeys(['a'], { a: 1, b: 2 })).toEqual({
            a: 1,
        });
    });

    it('returns empty object when keys list is empty', () => {
        expect(pickObjectEntriesByKeys([], { a: 1, b: 2 })).toEqual({});
    });

    it('ignores unknown keys in the allowlist', () => {
        expect(pickObjectEntriesByKeys(['c'], { a: 1, b: 2 })).toEqual({});
    });

    it('returns empty object when source object is empty', () => {
        expect(pickObjectEntriesByKeys(['a'], {})).toEqual({});
    });
});
